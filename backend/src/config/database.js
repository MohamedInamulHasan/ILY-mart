import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    console.log('⏳ Connecting to MongoDB...');
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 60000, // 60s timeout
            socketTimeoutMS: 120000, // 2 mins timeout
            maxPoolSize: 50, // Maintain up to 50 socket connections
            minPoolSize: 5,  // Maintain minimum 5 warm connections for instant response
            heartbeatFrequencyMS: 10000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.log('⚠️ Server will remain running, but DB requests will fail.');
        // Don't exit process, allow server to stay up for debugging
    }
};

export default connectDB;
