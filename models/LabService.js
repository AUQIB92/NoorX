import mongoose from "mongoose";

const labServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a service name"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a service description"],
    },
    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: 0,
    },
    duration: {
      type: Number,
      required: [true, "Please provide service duration in minutes"],
      min: 0,
    },
    category: {
      type: String,
      required: [true, "Please provide a service category"],
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: [true, "Lab reference is required"],
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    }
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
