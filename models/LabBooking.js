import mongoose from "mongoose";

const LabBookingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabService",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    price: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    result: {
      type: String,
      trim: true,
    },
    resultFile: {
      type: String,
    },
    resultDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create indexes for efficient querying
LabBookingSchema.index({ patient: 1, date: -1 });
LabBookingSchema.index({ lab: 1, date: -1 });
LabBookingSchema.index({ status: 1 });

export default mongoose.models.LabBooking ||
  mongoose.model("LabBooking", LabBookingSchema);
