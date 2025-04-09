import mongoose from "mongoose";

const labSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a lab name"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Please provide an address"],
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    openingHours: {
      type: String,
      required: [true, "Please provide opening hours"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for location field
labSchema.index({ location: "2dsphere" });

// Prevent duplicate model initialization
const Lab = mongoose.models.Lab || mongoose.model("Lab", labSchema);

export default Lab;
