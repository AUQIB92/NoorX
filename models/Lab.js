import mongoose from "mongoose";

const labSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a lab name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
    },
    location: {
      type: String,
      required: [true, "Please provide a location"],
    },
    address: {
      type: String,
      required: [true, "Please provide an address"],
    },
    description: {
      type: String,
      default: "",
    },
    services: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service"
    }],
    doctors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    openingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    ratings: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      date: {
        type: Date,
        default: Date.now
      }
    }],
    averageRating: {
      type: Number,
      default: 0
    },
    images: [{
      url: String,
      caption: String
    }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add indexes
labSchema.index({ name: 1 });
labSchema.index({ location: 1 });
labSchema.index({ isActive: 1 });

// Calculate average rating before saving
labSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    this.averageRating = this.ratings.reduce((acc, curr) => acc + curr.rating, 0) / this.ratings.length;
  }
  next();
});

// Virtual for total number of ratings
labSchema.virtual('totalRatings').get(function() {
  return this.ratings ? this.ratings.length : 0;
});

// Virtual for total number of doctors
labSchema.virtual('totalDoctors').get(function() {
  return this.doctors ? this.doctors.length : 0;
});

// Virtual for total number of services
labSchema.virtual('totalServices').get(function() {
  return this.services ? this.services.length : 0;
});

// Ensure proper model registration
const Lab = mongoose.models.Lab || mongoose.model("Lab", labSchema);

export default Lab;
