import mongoose from "mongoose";

const labServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Blood Test", "Imaging", "Pathology", "Other"],
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: [true, "Lab is required"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationInstructions: {
      type: String,
      trim: true,
    },
    turnaroundTime: {
      type: String,
      trim: true,
    },
    sampleType: {
      type: String,
      trim: true,
    },
    fastingRequired: {
      type: Boolean,
      default: false,
    },
    fastingHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Create a text index for search functionality
labServiceSchema.index({ name: "text", description: "text", category: "text" });

// Create compound index for lab and name to ensure uniqueness within a lab
labServiceSchema.index({ lab: 1, name: 1 }, { unique: true });

const LabService =
  mongoose.models.LabService || mongoose.model("LabService", labServiceSchema);

export default LabService;
