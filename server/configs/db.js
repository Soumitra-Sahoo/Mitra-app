import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on('connected', () => console.log('Database Connected'));

    mongoose.connection.on('error', (err) => {
        console.error('Database connection error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
        console.warn('Database disconnected');
    });

    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/Mitra`, {
            serverSelectionTimeoutMS: 10000,
        });
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    }
}

export default connectDB;