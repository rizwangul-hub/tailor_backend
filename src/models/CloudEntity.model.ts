import mongoose, { Schema } from 'mongoose';

// Customer Cloud Model
const CustomerCloudSchema = new Schema(
  {
    id: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    serialNumber: { type: String, required: true },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, default: null },
    photoLocalUri: { type: String, default: null },
    photoCloudUrl: { type: String, default: null },
    notes: { type: String, default: null },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    deletedAt: { type: String, default: null },
  },
  { timestamps: true }
);
CustomerCloudSchema.index({ tenantId: 1, id: 1 }, { unique: true });

// Measurement Cloud Model
const MeasurementCloudSchema = new Schema(
  {
    id: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    values: { type: String, required: true }, // JSON String
    options: { type: String, default: null }, // JSON String
    notes: { type: String, default: null },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    deletedAt: { type: String, default: null },
  },
  { timestamps: true }
);
MeasurementCloudSchema.index({ tenantId: 1, id: 1 }, { unique: true });

// Order Cloud Model
const OrderCloudSchema = new Schema(
  {
    id: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    measurementSnapshot: { type: String, required: true }, // JSON String snapshot
    orderDate: { type: String, required: true },
    expectedDate: { type: String, default: null },
    status: { type: String, required: true },
    notes: { type: String, default: null },
    photoLocalUri: { type: String, default: null },
    photoCloudUrl: { type: String, default: null },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    deletedAt: { type: String, default: null },
  },
  { timestamps: true }
);
OrderCloudSchema.index({ tenantId: 1, id: 1 }, { unique: true });

// Ledger Cloud Model
const LedgerCloudSchema = new Schema(
  {
    id: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    orderId: { type: String, default: null },
    type: { type: String, enum: ['CHARGE', 'PAYMENT'], required: true },
    amount: { type: Number, required: true },
    note: { type: String, default: null },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    deletedAt: { type: String, default: null },
  },
  { timestamps: true }
);
LedgerCloudSchema.index({ tenantId: 1, id: 1 }, { unique: true });

// Idempotent Sync Operation Log Model
const SyncOperationLogSchema = new Schema(
  {
    syncOperationId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    operation: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CustomerCloudModel = mongoose.model('CustomerCloud', CustomerCloudSchema);
export const MeasurementCloudModel = mongoose.model('MeasurementCloud', MeasurementCloudSchema);
export const OrderCloudModel = mongoose.model('OrderCloud', OrderCloudSchema);
export const LedgerCloudModel = mongoose.model('LedgerCloud', LedgerCloudSchema);
export const SyncOperationLogModel = mongoose.model('SyncOperationLog', SyncOperationLogSchema);
