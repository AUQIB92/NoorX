import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/db";
import Lab from "../../../../../models/Lab";
import LabService from "../../../../../models/LabService";
import { withAuth } from "../../../../../middleware/auth";

// GET /api/labs/[id]/services - Get all services for a specific lab
export const GET = withAuth(
  async (req, { params }) => {
    try {
      await connectToDatabase();

      const { id } = params;

      // Check if lab exists
      const lab = await Lab.findById(id);
      if (!lab) {
        return NextResponse.json({ error: "Lab not found" }, { status: 404 });
      }

      // Find all services for this lab
      const services = await LabService.find({ lab: id });

      return NextResponse.json({ services });
    } catch (error) {
      console.error("Error fetching lab services:", error);
      return NextResponse.json(
        { error: "Failed to fetch lab services" },
        { status: 500 }
      );
    }
  },
  ["admin", "labAdmin", "patient"]
);

// POST /api/labs/[id]/services - Create a new service for a lab
async function createLabService(req, { params }) {
  try {
    await connectToDatabase();

    // Check if lab exists
    const lab = await Lab.findById(params.id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get request body
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      );
    }

    // Check if service with same name already exists for this lab
    const existingService = await LabService.findOne({
      lab: params.id,
      name: body.name,
    });

    if (existingService) {
      return NextResponse.json(
        { error: "A service with this name already exists for this lab" },
        { status: 400 }
      );
    }

    // Create new service
    const service = new LabService({
      ...body,
      lab: params.id,
    });

    await service.save();

    return NextResponse.json(
      {
        message: "Service created successfully",
        service,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lab service:", error);
    return NextResponse.json(
      { error: "Failed to create lab service" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const POST = withAuth(createLabService, ["admin", "labAdmin"]);
