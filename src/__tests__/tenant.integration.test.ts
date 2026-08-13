import request from 'supertest';
import express from 'express';
import syncRoutes from '../routes/sync.routes';
import { LicenseModel } from '../models/License.model';
import { CustomerCloudModel } from '../models/CloudEntity.model';

const app = express();
app.use(express.json());
app.use('/api/sync', syncRoutes);

jest.mock('../models/License.model');
jest.mock('../models/CloudEntity.model');

describe('Tenant Isolation Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('pull sync should strictly enforce tenantId filtering', async () => {
    (LicenseModel.findOne as jest.Mock).mockResolvedValue({
      activeDeviceId: 'device-1'
    });

    (CustomerCloudModel.find as jest.Mock).mockResolvedValue([{ name: 'Test Cust' }]);

    const res = await request(app).post('/api/sync/pull').send({
      tenantId: 'tenant-A',
      deviceId: 'device-1'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify that the query explicitly included the exact tenantId
    const customerFindCallArg = (CustomerCloudModel.find as jest.Mock).mock.calls[0][0];
    expect(customerFindCallArg.tenantId).toBe('tenant-A');
  });

  it('should reject pull sync if device is not the active device (tenant security)', async () => {
    (LicenseModel.findOne as jest.Mock).mockResolvedValue({
      activeDeviceId: 'device-1'
    });

    const res = await request(app).post('/api/sync/pull').send({
      tenantId: 'tenant-A',
      deviceId: 'device-2' // Revoked / invalid device
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.isRevoked).toBe(true);
  });
});
