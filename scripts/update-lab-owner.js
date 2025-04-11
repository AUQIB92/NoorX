const dbConnect = require("../lib/dbConnect");
const Lab = require("../models/Lab");
const mongoose = require("mongoose");

async function updateLabOwner() {
  try {
    await dbConnect();
    console.log("Connected to database");

    const labId = "67f4bf259f2c85117179be9d";
    const ownerId = "67f4bf259f2c85117179be9b";

    const result = await Lab.findByIdAndUpdate(
      labId,
      { owner: new mongoose.Types.ObjectId(ownerId) },
      { new: true }
    );

    if (result) {
      console.log("Successfully updated lab owner:", result);
    } else {
      console.log("Lab not found");
    }
  } catch (error) {
    console.error("Error updating lab owner:", error);
  } finally {
    await mongoose.connection.close();
  }
}

updateLabOwner(); 