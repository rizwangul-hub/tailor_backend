import mongoose from 'mongoose';

let isConnected = false; // track the connection

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tailer_saas';

  try {
    const db = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${db.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error instanceof Error ? error.message : error}`);
    console.warn('Server running (MongoDB offline mode or ready to connect when available).');
  }
};
