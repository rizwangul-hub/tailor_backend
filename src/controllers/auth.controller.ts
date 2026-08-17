import { Request, Response } from 'express';
import { LicenseModel } from '../models/License.model';

export const activateLicense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { licenseKey, deviceId, deviceName, confirmTransfer } = req.body;

    if (!licenseKey || !deviceId) {
      res.status(400).json({ success: false, message: 'License key and Device ID are required.' });
      return;
    }

    const cleanKey = String(licenseKey).trim().toUpperCase();
    const cleanDeviceId = String(deviceId).trim();

    let license = await LicenseModel.findOne({ licenseKey: cleanKey });

    // The license must exist (Created by Admin)
    if (!license) {
      res.status(404).json({
        success: false,
        message: 'This access code is not currently available for use. Please contact the administrator.',
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

    // Check if active on another device
    if (license.activeDeviceId && license.activeDeviceId !== cleanDeviceId) {
      if (!confirmTransfer) {
        res.status(409).json({
          success: false,
          isAlreadyActive: true,
          activeDeviceName: license.activeDeviceName || 'Another Device',
          message: 'Your license is already active on another device.',
        });
        return;
      }

      // Confirm device transfer -> revoke old device & assign new device
      license.activeDeviceId = cleanDeviceId;
      license.activeDeviceName = deviceName || 'New Mobile Device';
      // Do NOT overwrite activatedAt here, just transfer the device.
      await license.save();

      res.status(200).json({
        success: true,
        tenantId: license.tenantId,
        licenseKey: license.licenseKey,
        isTransferred: true,
        message: 'License transferred to this device. Old device session revoked.',
        tailorName: license.tailorName,
        shopName: license.shopName,
        mobile: license.mobile,
        address: license.address,
        expiresAt: license.expiresAt,
      });
      return;
    }

    // Same device reactivating / logging in
    license.activeDeviceId = cleanDeviceId;
    if (deviceName) license.activeDeviceName = deviceName;
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
    const { tenantId, deviceId } = req.body;

    if (!tenantId || !deviceId) {
      res.status(400).json({ success: false, message: 'Tenant ID and Device ID are required.' });
      return;
    }

    const license = await LicenseModel.findOne({ tenantId });

    if (!license || license.activeDeviceId !== deviceId) {
      res.status(403).json({
        success: false,
        isRevoked: true,
        message: 'This license is active on another device.',
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
  try {
    const { tenantId, deviceId } = req.body;
    if (!tenantId || !deviceId) {
      res.status(400).json({ success: false, message: 'Missing fields' });
      return;
    }
    
    const license = await LicenseModel.findOne({ tenantId, activeDeviceId: deviceId });
    if (license) {
      license.activeDeviceId = null;
      license.activeDeviceName = null;
      await license.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
