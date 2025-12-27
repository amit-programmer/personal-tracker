const mongoose = require("mongoose");

async function connectDB() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personal-tracker';
    if (!process.env.MONGODB_URI) {
        console.warn('MONGODB_URI not set — falling back to local MongoDB:', uri);
    }
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB", uri);
        return mongoose;
    } catch (err) {
        console.error("Error connecting to MongoDB", err && err.message ? err.message : err);
        throw err;
    }
}

async function disconnectDB() {
    try {
        await mongoose.disconnect();
    } catch (err) {
        console.warn('Error disconnecting mongoose', err);
    }
}

module.exports = { connectDB, disconnectDB };