import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../../lib/db";
import Lab from "../../../../../../models/Lab";
import User from "../../../../../../models/User";
import { withAuth } from "../../../../../../middleware/auth";

// GET /api/labs/[id]/doctors/[doctorId] - Get a specific doctor in a lab
export const GET = withAuth(
  async (req, { params }) => {
    try {
      await connectToDatabase();

      const { id, doctorId } = params;

      // Check if lab exists
      const lab = await Lab.findById(id);
      if (!lab) {
        return NextResponse.json({ error: "Lab not found" }, { status: 404 });
      }

      // Find the doctor
      const doctor = await User.findOne({
        _id: doctorId,
        role: "doctor",
        lab: id,
        isDeleted: { $ne: true },
      }).select("-password");

      if (!doctor) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ doctor });
    } catch (error) {
      console.error("Error fetching doctor:", error);
      return NextResponse.json(
        { error: "Failed to fetch doctor" },
        { status: 500 }
      );
    }
  },
  ["admin", "labAdmin", "patient"]
);

// PUT /api/labs/[id]/doctors/[doctorId] - Update a doctor in a lab
export const PUT = withAuth(
  async (req, { params }) => {
    try {
      await connectToDatabase();

      const { id, doctorId } = params;
      const data = await req.json();

      // Check if lab exists
      const lab = await Lab.findById(id);
      if (!lab) {
        return NextResponse.json({ error: "Lab not found" }, { status: 404 });
      }

      // Find the doctor
      const doctor = await User.findOne({
        _id: doctorId,
        role: "doctor",
        lab: id,
        isDeleted: { $ne: true },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 }
        );
      }

      // Update doctor fields
      const updateFields = [
        "name",
        "specialization",
        "experience",
        "qualification",
        "email",
        "phone",
        "address",
        "isActive",
      ];

      updateFields.forEach((field) => {
        if (data[field] !== undefined) {
          doctor[field] = data[field];
        }
      });

      await doctor.save();

      // Return the updated doctor without password
      const { password, ...doctorWithoutPassword } = doctor.toObject();
      return NextResponse.json({ doctor: doctorWithoutPassword });
    } catch (error) {
      console.error("Error updating doctor:", error);
      return NextResponse.json(
        { error: "Failed to update doctor" },
        { status: 500 }
      );
    }
  },
  ["admin", "labAdmin"]
);

// DELETE /api/labs/[id]/doctors/[doctorId] - Delete a doctor from a lab
export const DELETE = withAuth(
  async (req, { params }) => {
    try {
      await connectToDatabase();

      const { id, doctorId } = params;

      // Check if lab exists
      const lab = await Lab.findById(id);
      if (!lab) {
        return NextResponse.json({ error: "Lab not found" }, { status: 404 });
      }

      // Find the doctor
      const doctor = await User.findOne({
        _id: doctorId,
        role: "doctor",
        lab: id,
        isDeleted: { $ne: true },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 }
        );
      }

      // Soft delete the doctor
      doctor.isDeleted = true;
      await doctor.save();

      return NextResponse.json({ message: "Doctor deleted successfully" });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      return NextResponse.json(
        { error: "Failed to delete doctor" },
        { status: 500 }
      );
    }
  },
  ["admin", "labAdmin"]
);
