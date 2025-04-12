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
  lab_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lab",
    required: function() {
      // lab_id is required only for lab services
      return this.service_type === "lab";
    },
    default: null,
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },
  service_type: {
    type: String,
    enum: ["regular", "lab"],
    required: true,
    default: "regular"
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
    enum: ["pending", "completed", "refunded"],
    default: "pending",
  },
  payment_amount: {
    type: Number,
    required: true,
  },
  payment_method: {
    type: String,
    enum: ["cash", "card", "insurance", "online"],
    default: "cash",
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
  slot_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DoctorSlot",
    required: function() {
      // slot_id is required only for regular services
      return this.service_type === "regular";
    },
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// Update the updatedAt field on save
appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for common queries
appointmentSchema.index({ patient_id: 1, status: 1 });
appointmentSchema.index({ doctor_id: 1, status: 1 });
appointmentSchema.index({ lab_id: 1, status: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ payment_status: 1 });

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);
export default Appointment;
