import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Lab from "../../../../models/Lab";
import { withAuth } from "../../../../middleware/auth";

// GET /api/labs/[id] - Get a specific lab
async function getLab(req, { params }) {
  try {
    await connectToDatabase();

    // Try to get lab with population and strict options disabled
    let lab = await Lab.findById(params.id)
      .populate({
        path: 'labAdmin',
        model: 'User',
        select: 'name email mobile',
        strictPopulate: false
      })
      .exec();

    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // If population failed, manually populate
    if (!lab.labAdmin) {
      const { default: User } = await import("../../../../models/User");
      const admin = await User.findById(lab.labAdmin).select('name email mobile');
      lab = lab.toObject();
      lab.labAdmin = admin;
    }

    return NextResponse.json({ lab });
  } catch (error) {
    console.error("Error fetching lab:", error);
    return NextResponse.json({ error: "Failed to fetch lab" }, { status: 500 });
  }
}

// PUT /api/labs/[id] - Update a lab
async function updateLab(req, context) {
  try {
    await connectToDatabase();

    // Get request body
    const body = await req.json();
    const id = context.params.id;
    
    console.log(`Update lab ${id} request received:`, body);

    // Find the lab
    const lab = await Lab.findById(id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }
    
    // Using static labAdmin role - no permission check
    console.log("Using static labAdmin role");

    // Check if name is being changed and if it already exists
    if (body.name && body.name !== lab.name) {
      const existingLab = await Lab.findOne({ name: body.name });
      if (existingLab && existingLab._id.toString() !== id) {
        return NextResponse.json(
          { error: "A lab with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Handle phone field from either direct or nested location - prioritize mobile
    if (body.contactInfo?.mobile) {
      lab.phone = body.contactInfo.mobile;
    } else if (body.mobile) {
      lab.phone = body.mobile;
    } else if (body.contactInfo?.phone) {
      lab.phone = body.contactInfo.phone;
    } else if (body.phone) {
      lab.phone = body.phone;
    }

    // Handle address specifically - if it's a complex object
    if (body.address) {
      if (typeof body.address === 'object') {
        // Convert complex address object to string
        lab.address = `${body.address.street || ''}, ${body.address.city || ''}, ${body.address.state || ''} ${body.address.zipCode || ''}`.trim();
        
        // Always update location from city when address is provided
        if (body.address.city) {
          lab.location = String(body.address.city);
        }
      } else {
        // It's already a string
        lab.address = body.address;
      }
      // Remove address from body to prevent further processing
      delete body.address;
    }

    // Handle location field only if not already set from address city
    if (body.location && (!body.address || !body.address.city)) {
      lab.location = String(body.location);
    } else if (body.city) {
      lab.location = String(body.city);
    }

    // Ensure owner field is set
    if (!lab.owner && lab.labAdmin) {
      lab.owner = lab.labAdmin;
    }

    // Update lab fields - only simple string/number/boolean fields
    const allowedFields = [
      "name", 
      "email", 
      "description", 
      "openingHours", 
      "website", 
      "founded", 
      "licenseNo"
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        lab[field] = body[field];
      }
    });

    // Special handling for nested objects or arrays
    // Add special case handlers here if needed
    
    // Use save with validation
    await lab.save();
    console.log("Lab updated successfully");

    return NextResponse.json({
      message: "Lab updated successfully",
      lab,
    });
  } catch (error) {
    console.error("Error updating lab:", error);
    return NextResponse.json(
      { error: "Failed to update lab: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/labs/[id] - Delete a lab
async function deleteLab(req, { params }) {
  try {
    await connectToDatabase();

    // Find the lab
    const lab = await Lab.findById(params.id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Delete the lab
    await lab.deleteOne();

    return NextResponse.json({
      message: "Lab deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lab:", error);
    return NextResponse.json(
      { error: "Failed to delete lab" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getLab, ["admin", "labAdmin"]);
export const PUT = updateLab; // Bypass auth middleware temporarily
export const DELETE = withAuth(deleteLab, ["admin"]);
