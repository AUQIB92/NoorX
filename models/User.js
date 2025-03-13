import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    sparse: true,
  },
  email: {
    type: String,
    sparse: true,
    default: null,
  },
  password: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "patient",
  },
  contactMethod: {
    type: String,
    enum: ["sms", "whatsapp", "email"],
    default: "sms",
  },
  otp: {
    code: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  otpExpiry: Date,
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Doctor-specific fields
  specialization: {
    type: String,
    default: null,
  },
  qualifications: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

// Create compound indexes for uniqueness only among verified users
userSchema.index(
  { email: 1, verified: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $ne: null },
      verified: true,
    },
    sparse: true,
  }
);

userSchema.index(
  { mobile: 1, verified: 1 },
  {
    unique: true,
    partialFilterExpression: {
      mobile: { $exists: true, $ne: null },
      verified: true,
    },
    sparse: true,
  }
);

// Use a different approach to handle model creation to avoid duplicate model errors
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
