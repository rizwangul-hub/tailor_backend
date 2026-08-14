import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { LicenseModel } from '../models/License.model';
import { AuditLogModel } from '../models/AuditLog.model';
import crypto from 'crypto';
import { AdminRequest } from '../middleware/admin.middleware';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '2426'; // Default fallback per requirement context
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Helper for audit logs
const logAdminAction = async (adminId: string, action: string, targetId?: string, metadata?: any) => {
  try {
    await AuditLogModel.create({ adminId, action, targetId, metadata });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ id: 'admin-1', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '12h' });
    await logAdminAction('admin-1', 'ADMIN_LOGIN');
    res.json({ success: true, token });
    return;
  }
  
  res.status(401).json({ success: false, message: 'Invalid admin credentials' });
};

export const getDashboardStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const total = await LicenseModel.countDocuments();
    const active = await LicenseModel.countDocuments({ status: 'ACTIVE' });
    const expired = await LicenseModel.countDocuments({ status: 'EXPIRED' });
    const blocked = await LicenseModel.countDocuments({ status: 'BLOCKED' });
    const daily = await LicenseModel.countDocuments({ plan: 'daily' });
    const weekly = await LicenseModel.countDocuments({ plan: 'weekly' });
    const monthly = await LicenseModel.countDocuments({ plan: 'monthly' });
    const yearly = await LicenseModel.countDocuments({ plan: 'yearly' });
    const lifetime = await LicenseModel.countDocuments({ plan: 'lifetime' });

    res.json({
      success: true,
      data: { total, active, expired, blocked, subscriptions: { daily, weekly, monthly, yearly, lifetime } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getLicenses = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const licenses = await LicenseModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: licenses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createLicense = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { plan, price, tenantId, tailorName, shopName, mobile, address, email } = req.body;
    
    // Generate code TLR-ABCD-EFGH-IJKL
    const genSegment = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    const licenseKey = `TLR-${genSegment()}-${genSegment()}-${genSegment()}`;
    const cleanTenantId = tenantId || `tenant_${licenseKey.replace(/-/g, '')}`;

    const license = await LicenseModel.create({
      licenseKey,
      tenantId: cleanTenantId,
      plan: plan || 'monthly',
      price: price || 0,
      status: 'AVAILABLE',
      tailorName: tailorName || 'Unknown Tailor',
      shopName: shopName || 'Unknown Shop',
      mobile: mobile || '',
      address: address || '',
      email: email || ''
    });

    await logAdminAction(req.admin?.id!, 'LICENSE_CREATED', license.id, { plan, price });
    res.status(201).json({ success: true, data: license });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getLicenseById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const license = await LicenseModel.findById(req.params.id);
    if (!license) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    res.json({ success: true, data: license });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const blockLicense = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const license = await LicenseModel.findByIdAndUpdate(req.params.id, { status: 'BLOCKED' }, { new: true });
    if (!license) return;
    await logAdminAction(req.admin?.id!, 'LICENSE_BLOCKED', license.id);
    res.json({ success: true, data: license });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const unblockLicense = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    // We assume unblocking resets it to ACTIVE if it was already activated, or AVAILABLE if not
    const license = await LicenseModel.findById(req.params.id);
    if (!license) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    
    license.status = license.activatedAt ? 'ACTIVE' : 'AVAILABLE';
    await license.save();
    
    await logAdminAction(req.admin?.id!, 'LICENSE_UNBLOCKED', license.id);
    res.json({ success: true, data: license });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const extendLicense = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { months } = req.body;
    const license = await LicenseModel.findById(req.params.id);
    if (!license) { res.status(404).json({ success: false, message: 'Not found' }); return; }

    if (license.plan === 'lifetime') {
      res.status(400).json({ success: false, message: 'Cannot extend a lifetime license' });
      return;
    }

    if (license.expiresAt) {
      const newExpiry = new Date(license.expiresAt);
      newExpiry.setMonth(newExpiry.getMonth() + (months || 1));
      license.expiresAt = newExpiry;
      await license.save();
      await logAdminAction(req.admin?.id!, 'LICENSE_EXTENDED', license.id, { months });
      res.json({ success: true, data: license });
    } else {
      res.status(400).json({ success: false, message: 'License has no expiry to extend' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changePlan = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;
    const license = await LicenseModel.findById(req.params.id);
    if (!license) return;

    license.plan = plan;
    // reset expiry based on new plan if it's already active
    if (license.activatedAt) {
      if (plan === 'lifetime') {
        license.expiresAt = undefined;
      } else if (plan === 'daily') {
        const d = new Date(license.activatedAt);
        d.setDate(d.getDate() + 1);
        license.expiresAt = d;
      } else if (plan === 'weekly') {
        const d = new Date(license.activatedAt);
        d.setDate(d.getDate() + 7);
        license.expiresAt = d;
      } else if (plan === 'monthly') {
        const d = new Date(license.activatedAt);
        d.setMonth(d.getMonth() + 1);
        license.expiresAt = d;
      } else if (plan === 'yearly') {
        const d = new Date(license.activatedAt);
        d.setFullYear(d.getFullYear() + 1);
        license.expiresAt = d;
      }
    }
    
    await license.save();
    await logAdminAction(req.admin?.id!, 'LICENSE_PLAN_CHANGED', license.id, { newPlan: plan });
    res.json({ success: true, data: license });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteLicense = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const license = await LicenseModel.findByIdAndDelete(req.params.id);
    if (!license) return;
    await logAdminAction(req.admin?.id!, 'LICENSE_DELETED', license.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTenants = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const licenses = await LicenseModel.find({ activatedAt: { $ne: null } }).sort({ lastActiveAt: -1 });
    res.json({ success: true, data: licenses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAuditLogs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const logs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
