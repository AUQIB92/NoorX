import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import Lab from "../../../models/Lab";
import User from "../../../models/User";
import { withAuth } from "../../../middleware/auth";

// GET /api/labs - Get all labs
async function getLabs(req, context) {
  try {
    await connectToDatabase();

    // Get query parameters with safe URL parsing
    let name = null;
    let email = null;
    let city = null;
    let state = null;
    let isActive = null;

    try {
      if (req.url) {
        const { searchParams } = new URL(req.url);
        name = searchParams.get("name");
        email = searchParams.get("email");
        city = searchParams.get("city");
        state = searchParams.get("state");
        isActive = searchParams.get("isActive");
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
      // Continue with null values for parameters
    }

    // Build query
    const query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    if (city) {
      query["address.city"] = { $regex: city, $options: "i" };
    }

    if (state) {
      query["address.state"] = { $regex: state, $options: "i" };
    }

    if (isActive !== null) {
      query.isActive = isActive === "true";
    }

    // Get labs with population and strict options disabled
    const labs = await Lab.find(query)
      .populate({
        path: 'labAdmin',
        model: User,
        select: 'name email mobile',
        strictPopulate: false
      })
      .exec();

    // If labs are found but population failed, manually populate
    if (labs.length > 0 && !labs[0].labAdmin) {
      const populatedLabs = await Promise.all(
        labs.map(async (lab) => {
          const admin = await User.findById(lab.labAdmin).select('name email mobile');
          return {
            ...lab.toObject(),
            labAdmin: admin
          };
        })
      );
      return NextResponse.json({ labs: populatedLabs });
    }

    return NextResponse.json({ labs });
  } catch (error) {
    console.error("Error fetching labs:", error);
    return NextResponse.json(
      { error: "Failed to fetch labs" },
      { status: 500 }
    );
  }
}

// POST /api/labs - Create a new lab
async function createLab(req, context) {
  try {
    await connectToDatabase();

    // Get request body
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email || !body.contactInfo?.phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Check if lab with same name already exists
    const existingLab = await Lab.findOne({ name: body.name });
    if (existingLab) {
      return NextResponse.json(
        { error: "A lab with this name already exists" },
        { status: 400 }
      );
    }

    // Check if user with same email already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create lab admin user
    const labAdmin = new User({
      name: body.name,
      email: body.email,
      role: "labAdmin",
      verified: true,
      address: body.address?.street || "Lab Address",
      mobile: body.contactInfo?.mobile || body.contactInfo?.phone,
    });
    await labAdmin.save();

    // Create new lab with lab admin reference and phone field directly set
    const lab = new Lab({
      ...body,
      phone: body.contactInfo?.mobile || body.mobile || body.contactInfo?.phone || body.phone, // Prioritize mobile number
      owner: labAdmin._id, // Set owner to the lab admin
      // Convert complex address object to string
      address: body.address?.street ? 
        `${body.address.street}, ${body.address.city || ''}, ${body.address.state || ''} ${body.address.zipCode || ''}`.trim() : 
        (body.address || ''),
      // Always prioritize city from address for location
      location: String(body.address?.city || body.city || body.location || body.address?.street || ''),
      labAdmin: labAdmin._id,
    });
    await lab.save();

    return NextResponse.json(
      {
        message: "Lab and lab admin created successfully",
        lab,
        labAdmin: {
          id: labAdmin._id,
          name: labAdmin.name,
          email: labAdmin.email,
          role: labAdmin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lab:", error);
    return NextResponse.json(
      { error: "Failed to create lab: " + error.message },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = (req, context) => withAuth(getLabs, ["admin", "labAdmin"])(req, context);
export const POST = (req, context) => withAuth(createLab, ["admin"])(req, context);
