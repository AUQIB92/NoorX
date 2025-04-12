import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function dropGeoIndex() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the labs collection
    const db = mongoose.connection.db;
    const labsCollection = db.collection('labs');
    
    // List all indexes on the collection
    console.log('Current indexes:');
    const indexes = await labsCollection.indexes();
    console.log(indexes);
    
    // Find and drop the 2dsphere index
    let geoIndexFound = false;
    for (const index of indexes) {
      if (index.key && index.key.location === '2dsphere') {
        console.log('Found 2dsphere index:', index.name);
        geoIndexFound = true;
        
        try {
          console.log('Dropping 2dsphere index...');
          await labsCollection.dropIndex(index.name);
          console.log('Index dropped successfully');
        } catch (dropError) {
          console.error('Error dropping index:', dropError);
        }
      }
    }
    
    if (!geoIndexFound) {
      console.log('No 2dsphere index found on location field');
    }
    
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
dropGeoIndex(); 