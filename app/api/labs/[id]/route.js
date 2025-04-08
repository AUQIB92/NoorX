import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Lab from "../../../../models/Lab";
import { withAuth } from "../../../../middleware/auth";

// GET /api/labs/[id] - Get a specific lab
async function getLab(req, { params }) {
  try {
    await connectToDatabase();

    const lab = await Lab.findById(params.id).populate(
      "labAdmin",
      "name email mobile"
    );
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    return NextResponse.json({ lab });
  } catch (error) {
    console.error("Error fetching lab:", error);
    return NextResponse.json({ error: "Failed to fetch lab" }, { status: 500 });
  }
}

// PUT /api/labs/[id] - Update a lab
async function updateLab(req, { params }) {
  try {
    await connectToDatabase();

    // Get request body
    const body = await req.json();

    // Find the lab
    const lab = await Lab.findById(params.id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Check if name is being changed and if it already exists
    if (body.name && body.name !== lab.name) {
      const existingLab = await Lab.findOne({ name: body.name });
      if (existingLab) {
        return NextResponse.json(
          { error: "A lab with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update lab fields
    Object.keys(body).forEach((key) => {
      if (
        key === "address" ||
        key === "contactInfo" ||
        key === "workingHours"
      ) {
        lab[key] = { ...lab[key], ...body[key] };
      } else {
        lab[key] = body[key];
      }
    });

    // Save updated lab
    await lab.save();

    return NextResponse.json({
      message: "Lab updated successfully",
      lab,
    });
  } catch (error) {
    console.error("Error updating lab:", error);
    return NextResponse.json(
      { error: "Failed to update lab" },
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
export const PUT = withAuth(updateLab, ["admin"]);
export const DELETE = withAuth(deleteLab, ["admin"]);
