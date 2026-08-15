const mongoose = require('mongoose');
const { Schema } = mongoose;
const LicenseSchema = new Schema({
  licenseKey: { type: String, required: true },
  tenantId: { type: String, required: true },
  plan: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', 'lifetime'], default: 'monthly' },
  status: { type: String, enum: ['AVAILABLE', 'ACTIVE', 'EXPIRED', 'BLOCKED', 'REVOKED'], default: 'AVAILABLE' },
  activeDeviceId: { type: String, default: null },
  activeDeviceName: { type: String, default: null },
  activatedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
});
const License = mongoose.model('License', LicenseSchema);

async function test() {
  await mongoose.connect('mongodb+srv://rizwangul535_db_user:LYGTNebZbKQQ0csd@cluster0.wun93hu.mongodb.net/Tailor_Mangment?retryWrites=true&w=majority');
  
  const license = await License.findOne({ licenseKey: 'TLR-176B-E780-8829' });
  console.log('License:', license);

  process.exit(0);
}
test();
