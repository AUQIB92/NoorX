import { NextResponse } from "next/server";
import db from "@/lib/db";
import Lab from "@/models/Lab";
import LabService from "@/models/LabService";
import { withAuth } from "@/middleware/auth";

// GET /api/labs/[id]/services/[serviceId] - Get a specific lab service
async function getLabService(req, { params }) {
  try {
    await db();

    // Check if lab exists
    const lab = await Lab.findById(params.id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get service
    const service = await LabService.findOne({
      _id: params.serviceId,
      lab: params.id,
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error fetching lab service:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab service" },
      { status: 500 }
    );
  }
}

// PUT /api/labs/[id]/services/[serviceId] - Update a lab service
async function updateLabService(req, { params }) {
  try {
    await db();

    // Check if lab exists
    const lab = await Lab.findById(params.id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get service
    const service = await LabService.findOne({
      _id: params.serviceId,
      lab: params.id,
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Get request body
    const body = await req.json();

    // Check if name is being changed and if it already exists
    if (body.name && body.name !== service.name) {
      const existingService = await LabService.findOne({
        lab: params.id,
        name: body.name,
        _id: { $ne: params.serviceId },
      });

      if (existingService) {
        return NextResponse.json(
          { error: "A service with this name already exists for this lab" },
          { status: 400 }
        );
      }
    }

    // Update service fields
    Object.keys(body).forEach((key) => {
      service[key] = body[key];
    });

    // Save updated service
    await service.save();

    return NextResponse.json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Error updating lab service:", error);
    return NextResponse.json(
      { error: "Failed to update lab service" },
      { status: 500 }
    );
  }
}

// DELETE /api/labs/[id]/services/[serviceId] - Delete a lab service
async function deleteLabService(req, { params }) {
  try {
    await db();

    // Check if lab exists
    const lab = await Lab.findById(params.id);
    import { NextResponse } from "next/server";
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get service
    const service = await LabService.findOne({
      _id: params.serviceId,
      lab: params.id,
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete service
    await service.deleteOne();

    return NextResponse.json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lab service:", error);
    return NextResponse.json(
      { error: "Failed to delete lab service" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getLabService, ["admin", "labAdmin", "patient"]);
export const PUT = withAuth(updateLabService, ["admin", "labAdmin"]);
export const DELETE = withAuth(deleteLabService, ["admin", "labAdmin"]);

import db from "../../lib/db";
import Lab from "../../models/Lab";
import LabService from "../../models/LabService";
import { withAuth } from "@/middleware/auth";

// GET /api/labs/[id]/services/[serviceId] - Get a specific lab service
async function getLabService(req, { params }) {
  try {
    await db();

    // Check if lab exists
    const lab = await Lab.findById(params.id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get service
    const service = await LabService.findOne({
      _id: params.serviceId,
      lab: params.id,
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error fetching lab service:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab service" },
      { status: 500 }
    );
  }
}

// PUT /api/labs/[id]/services/[serviceId] - Update a lab service
async function updateLabService(req, { params }) {
  try {
    await db();

    // Check if lab exists
    const lab = await Lab.findById(params.id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get service
    const service = await LabService.findOne({
      _id: params.serviceId,
      lab: params.id,
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Get request body
    const body = await req.json();

    // Check if name is being changed and if it already exists
    if (body.name && body.name !== service.name) {
      const existingService = await LabService.findOne({
        lab: params.id,
        name: body.name,
        _id: { $ne: params.serviceId },
      });

      if (existingService) {
        return NextResponse.json(
          { error: "A service with this name already exists for this lab" },
          { status: 400 }
        );
      }
    }

    // Update service fields
    Object.keys(body).forEach((key) => {
      service[key] = body[key];
    });

    // Save updated service
    await service.save();

    return NextResponse.json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Error updating lab service:", error);
    return NextResponse.json(
      { error: "Failed to update lab service" },
      { status: 500 }
    );
  }
}

// DELETE /api/labs/[id]/services/[serviceId] - Delete a lab service
async function deleteLabService(req, { params }) {
  try {
    await db();

    // Check if lab exists
    const lab = await Lab.findById(params.id);
    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    // Get service
    const service = await LabService.findOne({
      _id: params.serviceId,
      lab: params.id,
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete service
    await service.deleteOne();

    return NextResponse.json({
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lab service:", error);
    return NextResponse.json(
      { error: "Failed to delete lab service" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getLabService, ["admin", "labAdmin", "patient"]);
export const PUT = withAuth(updateLabService, ["admin", "labAdmin"]);
export const DELETE = withAuth(deleteLabService, ["admin", "labAdmin"]);
