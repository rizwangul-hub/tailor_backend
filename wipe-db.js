
const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if(!mongoURI) {
        console.log('No MONGODB_URI in .env');
        process.exit(1);
    }
    await mongoose.connect(mongoURI);
    
    // License Schema
    const LicenseSchema = new mongoose.Schema({}, { strict: false });
    const License = mongoose.model('License', LicenseSchema);
    
    const result = await License.deleteMany({});
    console.log('Deleted licenses:', result.deletedCount);
    
    // Also delete tenants / audit logs if necessary, but request just said 'customers' (licenses)
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();

