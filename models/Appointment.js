import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'service_model',
    required: true,
  },
  service_model: {
    type: String,
    enum: ['Service', 'LabService'],
    default: 'Service'
  },
  lab_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lab",
    default: null,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  payment_status: {
    type: String,
    enum: ["pending", "completed", "refunded", "failed", "paid"],
    default: "pending",
  },
  payment_amount: {
    type: Number,
    default: 0,
  },
  payment_method: {
    type: String,
    enum: ["cash", "online", "insurance", ""],
    default: "",
  },
  payment_date: {
    type: Date,
    default: null,
  },
  // Razorpay payment details
  payment_id: {
    type: String,
    default: null,
  },
  razorpay_order_id: {
    type: String,
    default: null,
  },
  razorpay_signature: {
    type: String,
    default: null,
  },
  booked_by: {
    type: String,
    enum: ["patient", "admin", "doctor", "labAdmin"],
    default: "patient",
  },
  notes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);
export default Appointment;
