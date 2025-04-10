import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import Service from "../../../models/Service";
import { withAuth } from "../../../middleware/auth";

// Get all services
async function getServices(req, context) {
  try {
    await connectToDatabase();

    // Initialize default values
    let category = null;
    let isActive = null;

    // Safely parse URL parameters if URL exists
    if (req.url) {
      try {
        const { searchParams } = new URL(req.url);
        category = searchParams.get("category");
        isActive = searchParams.get("isActive");
      } catch (urlError) {
        console.error("Error parsing URL:", urlError);
        // Continue with null values for the parameters
      }
    }

    let query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const services = await Service.find(query).sort({ category: 1, name: 1 });

    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error("Get services error:", error);
    
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

// Add a new service (admin only)
async function createService(req, context) {
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

    const { name, description, duration, price, category } = await req.json();

    // Validate required fields
    if (!name || !description || !duration || !price || !category) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if service already exists
    const existingService = await Service.findOne({ name });

    if (existingService) {
      return NextResponse.json(
        { error: "Service with this name already exists" },
        { status: 409 }
      );
    }

    // Create new service
    const newService = new Service({
      name,
      description,
      duration,
      price,
      category,
      createdBy: context.user.id // Track who created the service
    });

    await newService.save();

    return NextResponse.json(
      {
        message: "Service added successfully",
        service: newService,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add service error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getServices, ["admin", "doctor", "patient"]);
export const POST = withAuth(createService, ["admin"]);

// Add additional error handling around the middleware
export async function GET_errorHandled(req) {
  try {
    return await GET(req);
  } catch (error) {
    console.error("Unhandled GET error in services route:", error);
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
    console.error("Unhandled POST error in services route:", error);
    return NextResponse.json(
      { error: "Internal server error in POST handler" },
      { status: 500 }
    );
  }
}
