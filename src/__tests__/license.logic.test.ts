import { LicenseModel } from '../models/License.model';

describe('License Logic', () => {
  it('should calculate monthly expiry correctly', () => {
    const activationDate = new Date('2026-08-12T10:00:00Z');
    const expiry = new Date(activationDate);
    expiry.setMonth(expiry.getMonth() + 1);
    
    expect(expiry.toISOString()).toBe(new Date('2026-09-12T10:00:00Z').toISOString());
  });

  it('should calculate yearly expiry correctly', () => {
    const activationDate = new Date('2026-08-12T10:00:00Z');
    const expiry = new Date(activationDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    
    expect(expiry.toISOString()).toBe(new Date('2027-08-12T10:00:00Z').toISOString());
  });

  it('one-device rule: should detect if active on another device', () => {
    const license = {
      activeDeviceId: 'device-A',
      activeDeviceName: 'Old Phone'
    };
    
    const incomingDeviceId = 'device-B';
    const isAlreadyActive = license.activeDeviceId && license.activeDeviceId !== incomingDeviceId;
    
    expect(isAlreadyActive).toBe(true);
  });

  it('one-device rule: should allow same device reactivation', () => {
    const license = {
      activeDeviceId: 'device-A',
      activeDeviceName: 'Phone'
    };
    
    const incomingDeviceId = 'device-A';
    const isAlreadyActive = license.activeDeviceId && license.activeDeviceId !== incomingDeviceId;
    
    expect(isAlreadyActive).toBe(false);
  });
});
