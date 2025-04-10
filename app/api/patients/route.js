import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import User from "../../../models/User";
import { withAuth } from "../../../middleware/auth";
import bcrypt from "bcrypt";

// Get patients with optional search by mobile number
async function getPatients(req, context) {
  try {
    await connectToDatabase();

    // Initialize searchQuery to null
    let searchQuery = null;

    // Safely parse URL parameters if URL exists
    if (req.url) {
      try {
        const url = new URL(req.url);
        searchQuery = url.searchParams.get("search");
      } catch (urlError) {
        console.error("Error parsing URL:", urlError);
        // Continue with null value for searchQuery
      }
    }

    let query = { role: "patient" };

    // If search query exists, add it to the query
    if (searchQuery) {
      query.mobile = { $regex: searchQuery, $options: "i" };
    }

    // Limit the number of results if no search query
    const limit = searchQuery ? 0 : 20;

    const patients = await User.find(query)
      .select("-password")
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json({ patients }, { status: 200 });
  } catch (error) {
    console.error("Get patients error:", error);
    
    // Handle specific error types
    if (error.code === "ERR_INVALID_URL") {
      return NextResponse.json(
        { error: "Invalid URL provided. Please check your request." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new patient
async function createPatient(req, context) {
  try {
    await connectToDatabase();
    
    // Ensure user exists in context
    if (!context || !context.user) {
      console.error("User not found in context");
      return NextResponse.json(
        { error: "Authentication error. Please log in again." },
        { status: 401 }
      );
    }

    const { name, mobile, email, address } = await req.json();

    // Validate required fields
    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Name and mobile number are required" },
        { status: 400 }
      );
    }

    // Validate mobile number format (10 digits, optionally with +91 country code)
    const mobileRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        {
          error:
            "Invalid mobile number format. Please enter a valid 10-digit Indian mobile number",
        },
        { status: 400 }
      );
    }

    // Check if patient already exists with the same mobile
    const existingPatient = await User.findOne({ mobile });
    if (existingPatient) {
      return NextResponse.json(
        { error: "A user with this mobile number already exists" },
        { status: 400 }
      );
    }

    // Generate a random password for the new patient
    const tempPassword = `${mobile}123`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newPatient = new User({
      name,
      mobile,
      email: email || `${mobile}@placeholder.com`,
      address: address || "Not provided",
      role: "patient",
      password: hashedPassword,
    });

    await newPatient.save();

    // Don't return the password
    const patientToReturn = { ...newPatient.toObject() };
    delete patientToReturn.password;

    return NextResponse.json(
      {
        message: "Patient created successfully",
        patient: patientToReturn,
        tempPassword, // This would be sent to the patient via SMS in a real app
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getPatients);
export const POST = withAuth(createPatient);

// Add additional error handling around the middleware
export async function GET_errorHandled(req) {
  try {
    return await GET(req);
  } catch (error) {
    console.error("Unhandled GET error in patients route:", error);
    return NextResponse.json(
      { error: "Internal server error in GET handler" },
      { status: 500 }
    );
  }
}

export async function POST_errorHandled(req) {
  try {
    return await POST(req);
  } catch (error) {
    console.error("Unhandled POST error in patients route:", error);
    return NextResponse.json(
      { error: "Internal server error in POST handler" },
      { status: 500 }
    );
  }
}
