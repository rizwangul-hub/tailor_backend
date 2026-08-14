import mongoose, { Schema, Document } from 'mongoose';

export interface ILicense extends Document {
  licenseKey: string;
  tenantId: string;
  plan: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  status: 'AVAILABLE' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED' | 'REVOKED';
  price: number;
  activeDeviceId?: string;
  activeDeviceName?: string;
  activatedAt?: Date;
  expiresAt?: Date;
  lastActiveAt?: Date;
  lastSyncAt?: Date;
  tailorName?: string;
  shopName?: string;
  mobile?: string;
  address?: string;
  email?: string;
}

const LicenseSchema = new Schema<ILicense>(
  {
    licenseKey: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    plan: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', 'lifetime'], default: 'monthly' },
    status: { type: String, enum: ['AVAILABLE', 'ACTIVE', 'EXPIRED', 'BLOCKED', 'REVOKED'], default: 'AVAILABLE' },
    price: { type: Number, default: 0 },
    activeDeviceId: { type: String, default: null },
    activeDeviceName: { type: String, default: null },
    activatedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
    lastSyncAt: { type: Date, default: null },
    tailorName: { type: String, default: 'Unknown Tailor' },
    shopName: { type: String, default: 'Unknown Shop' },
    mobile: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { timestamps: true }
);

export const LicenseModel = mongoose.model<ILicense>('License', LicenseSchema);
