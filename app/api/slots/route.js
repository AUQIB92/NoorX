import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import DoctorSlot from "../../../models/DoctorSlot";
import User from "../../../models/User";
import { withAuth } from "../../../middleware/auth";
import { generateDefaultDoctorSlots } from "../../../utils/slotGenerator";

// Helper function for standardized error responses
const errorResponse = (message, status = 500, details = null) => {
  console.error(`API Error [${status}]:`, message, details || '');
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
};

// Helper function for standardized success responses
const successResponse = (data, message = null, status = 200) => {
  return NextResponse.json(
    { 
      success: true, 
      ...(message ? { message } : {}),
      ...data
    },
    { status }
  );
};

// Helper function to validate request
const validateRequest = async (req, context) => {
  if (!context || !context.user) {
    return { error: "Authentication error. Please log in again.", status: 401 };
  }
  
  let requestData;
  try {
    // Try parsing the request body
    requestData = await req.json();
  } catch (parseError) {
    return { error: "Invalid request body", status: 400 };
  }
  
  return { requestData };
};

// Get slots with filtering options
async function getSlots(req, context) {
  try {
    await connectToDatabase();

    // Initialize parameters to null
    let doctorId = null;
    let day = null;
    let isAvailable = null;
    let isAdminOnly = null;

    // Safely parse URL parameters if URL exists
    if (req.url) {
      try {
        const { searchParams } = new URL(req.url);
        doctorId = searchParams.get("doctor_id");
        day = searchParams.get("day");
        isAvailable = searchParams.get("is_available");
        isAdminOnly = searchParams.get("is_admin_only");
      } catch (urlError) {
        console.error("Error parsing URL:", urlError);
        // Continue with null values for the parameters
      }
    }

    let query = {};

    if (doctorId) {
      query.doctor_id = doctorId;
    }

    if (day) {
      query.day = day;
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      query.is_available = isAvailable === "true";
    }

    if (isAdminOnly !== null && isAdminOnly !== undefined) {
      query.is_admin_only = isAdminOnly === "true";
    }

    const slots = await DoctorSlot.find(query)
      .populate("doctor_id", "name specialization")
      .sort({ day: 1, start_time: 1 });

    return successResponse({ slots });
  } catch (error) {
    return errorResponse("Failed to fetch slots", 500, error.message);
  }
}

// Generate default slots for a doctor
async function generateSlots(req, context) {
  try {
    await connectToDatabase();
    
    // Validate request
    const validation = await validateRequest(req, context);
    if (validation.error) {
      return errorResponse(validation.error, validation.status);
    }
    
    const { doctor_id } = validation.requestData;

    if (!doctor_id) {
      return errorResponse("Doctor ID is required", 400);
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctor_id, role: "doctor" });
    if (!doctor) {
      return errorResponse("Doctor not found", 404);
    }

    // Check if slots already exist for this doctor
    const existingSlots = await DoctorSlot.find({ doctor_id });
    if (existingSlots.length > 0) {
      return successResponse({ count: existingSlots.length }, "Slots already exist for this doctor");
    }

    // Generate default slots
    const slots = generateDefaultDoctorSlots(doctor_id);

    // Insert slots into database
    await DoctorSlot.insertMany(slots);

    return successResponse(
      { count: slots.length },
      "Default slots generated successfully",
      201
    );
  } catch (error) {
    return errorResponse("Failed to generate slots", 500, error.message);
  }
}

// Update multiple slots
async function updateSlots(req, context) {
  try {
    await connectToDatabase();
    
    // Validate request
    const validation = await validateRequest(req, context);
    if (validation.error) {
      return errorResponse(validation.error, validation.status);
    }
    
    const { slots } = validation.requestData;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return errorResponse("Valid slots array is required", 400);
    }

    const updatePromises = slots.map(async (slot) => {
      if (!slot._id) {
        return { error: "Slot ID is required", slot };
      }

      try {
        const updatedSlot = await DoctorSlot.findByIdAndUpdate(
          slot._id,
          {
            $set: {
              is_available: slot.is_available,
              is_admin_only: slot.is_admin_only,
              updated_at: new Date(),
            },
          },
          { new: true }
        );

        return updatedSlot || { error: "Slot not found", id: slot._id };
      } catch (err) {
        return { error: err.message, id: slot._id };
      }
    });

    const results = await Promise.all(updatePromises);
    return successResponse({ results }, "Slots updated");
  } catch (error) {
    return errorResponse("Failed to update slots", 500, error.message);
  }
}

// Apply authentication middleware with appropriate role permissions
export const GET = (req, context) => withAuth(getSlots, ["admin", "doctor", "patient", "labAdmin"])(req, context);
export const POST = (req, context) => withAuth(generateSlots, ["admin", "labAdmin"])(req, context);
export const PUT = (req, context) => withAuth(updateSlots, ["admin", "labAdmin"])(req, context);
