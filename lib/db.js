import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dbConnect from "./dbConnect";

// MongoDB connection string from environment variables
const MONGODB_URI =
  process.env.MONGODB_URI

// Connection options with timeouts and retry settings
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  family: 4, // Use IPv4, skip trying IPv6
};

// Maximum number of connection retries
const MAX_RETRIES = 3;

async function connectToDatabase(retryCount = 0) {
  try {
    // Use the main dbConnect function
    const connection = await dbConnect();
    
    // Once connected, initialize the admin user
    await initializeAdmin();
    
    return connection;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    
    // If we haven't reached max retries, try again
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection (${retryCount + 1}/${MAX_RETRIES})...`);
      // Wait for a bit before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectToDatabase(retryCount + 1);
    }
    
    throw error;
  }
}

// Function to create initial admin user if it doesn't exist
async function initializeAdmin() {
  try {
    // Dynamically import the User model to avoid issues with Next.js
    const { default: User } = await import("../models/User");

    const existingAdmin = await User.findOne({ role: "admin" });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      const newAdmin = new User({
        name: "Admin",
        mobile: "9999999999",
        email: "auqib.cse@gcetkashmir.ac.in",
        address: "Admin Office",
        password: hashedPassword,
        role: "admin",
        verified: true,
      });

      await newAdmin.save();
      console.log("Initial admin user created:", newAdmin.email);
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error initializing admin:", error.message);
  }
}

// Export the function directly as default
const db = connectToDatabase;
export default db;
