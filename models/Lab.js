import mongoose from "mongoose";

const labSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Lab name is required"],
      trim: true,
      unique: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    contactInfo: {
      phone: String,
      mobile: String,
      email: String,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    labAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    workingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for location field
labSchema.index({ location: "2dsphere" });

const Lab = mongoose.models.Lab || mongoose.model("Lab", labSchema);

export default Lab;
