import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.routes';
import { LicenseModel } from '../models/License.model';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

jest.mock('../models/License.model');

describe('Auth Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should activate a license successfully if it does not exist (dev auto-provisioning)', async () => {
    (LicenseModel.findOne as jest.Mock).mockResolvedValue(null);
    (LicenseModel.create as jest.Mock).mockResolvedValue({
      licenseKey: 'TEST-KEY',
      tenantId: 'tenant_TESTKEY',
      plan: 'monthly',
      status: 'ACTIVE',
      activeDeviceId: 'device-1'
    });

    const res = await request(app).post('/api/auth/activate').send({
      licenseKey: 'TEST-KEY',
      deviceId: 'device-1'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tenantId).toBe('tenant_TESTKEY');
  });

  it('should reject activation if active on another device', async () => {
    (LicenseModel.findOne as jest.Mock).mockResolvedValue({
      licenseKey: 'TEST-KEY',
      tenantId: 'tenant_TESTKEY',
      activeDeviceId: 'device-1',
      activeDeviceName: 'Phone'
    });

    const res = await request(app).post('/api/auth/activate').send({
      licenseKey: 'TEST-KEY',
      deviceId: 'device-2' // Different device
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.isAlreadyActive).toBe(true);
  });

  it('should transfer license if confirmTransfer is true', async () => {
    const mockSave = jest.fn();
    (LicenseModel.findOne as jest.Mock).mockResolvedValue({
      licenseKey: 'TEST-KEY',
      tenantId: 'tenant_TESTKEY',
      activeDeviceId: 'device-1',
      save: mockSave
    });

    const res = await request(app).post('/api/auth/activate').send({
      licenseKey: 'TEST-KEY',
      deviceId: 'device-2',
      confirmTransfer: true
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isTransferred).toBe(true);
    expect(mockSave).toHaveBeenCalled();
  });
});
