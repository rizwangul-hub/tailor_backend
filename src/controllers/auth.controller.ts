import { Request, Response } from 'express';
import { LicenseModel } from '../models/License.model';

export const activateLicense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { licenseKey, password } = req.body;

    if (!licenseKey || !password) {
      res.status(400).json({ success: false, message: 'License key and Password are required.' });
      return;
    }

    const cleanKey = String(licenseKey).trim().toUpperCase();
    const cleanPassword = String(password).trim();

    let license = await LicenseModel.findOne({ licenseKey: cleanKey });

    // The license must exist (Created by Admin)
    if (!license) {
      res.status(404).json({
        success: false,
        message: 'This access code is not currently available for use. Please contact the administrator.',
      });
      return;
    }

    // Verify Password
    if (license.password !== cleanPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your credentials.',
      });
      return;
    }
    
    // Check if the license is blocked
    if (license.status === 'BLOCKED') {
      res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the administrator.',
      });
      return;
    }

    // Check if the license is expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      license.status = 'EXPIRED';
      await license.save();
      res.status(403).json({
        success: false,
        message: 'Your plan has expired. Please contact the administrator to renew your license.',
      });
      return;
    }

    // First-time activation logic
    if (license.status === 'AVAILABLE' || license.status === 'EXPIRED') {
      license.status = 'ACTIVE';
      license.activatedAt = new Date();

      if (license.plan === 'daily') {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        license.expiresAt = d;
      } else if (license.plan === 'weekly') {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        license.expiresAt = d;
      } else if (license.plan === 'monthly') {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        license.expiresAt = d;
      } else if (license.plan === 'yearly') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        license.expiresAt = d;
      }
    }

    // No device lock anymore, just save and return success
    await license.save();

    res.status(200).json({
      success: true,
      tenantId: license.tenantId,
      licenseKey: license.licenseKey,
      isTransferred: false,
      message: 'License verified.',
      tailorName: license.tailorName,
      shopName: license.shopName,
      mobile: license.mobile,
      address: license.address,
      expiresAt: license.expiresAt,
    });
  } catch (error) {
    console.error('[Auth Controller] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const verifySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      res.status(400).json({ success: false, message: 'Tenant ID is required.' });
      return;
    }

    const license = await LicenseModel.findOne({ tenantId });

    if (!license) {
      res.status(403).json({
        success: false,
        isRevoked: true,
        message: 'License not found.',
      });
      return;
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      license.status = 'EXPIRED';
      await license.save();
      res.status(403).json({
        success: false,
        isExpired: true,
        message: 'This license has expired.',
      });
      return;
    }

    res.status(200).json({ success: true, isRevoked: false });
  } catch (error) {
    console.error('[VerifySession Controller] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // Device tracking is removed. Logging out is purely client-side now.
  res.json({ success: true });
};
