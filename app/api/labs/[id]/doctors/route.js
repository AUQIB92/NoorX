import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import User from "../../../../../models/User";
import Lab from "../../../../../models/Lab";
import { withAuth } from "../../../../../middleware/auth";

// GET /api/labs/[id]/doctors - Get all doctors for a specific lab
export const GET = withAuth(
  async (req, { params }) => {
    try {
      await connectDB();

      const { id } = params;

      // Check if lab exists
      const lab = await Lab.findById(id);
      if (!lab) {
        return NextResponse.json({ error: "Lab not found" }, { status: 404 });
      }

      // Find all doctors associated with this lab
      const doctors = await User.find({
        role: "doctor",
        lab: id,
        isDeleted: false,
      }).select("-password");

      return NextResponse.json({ doctors });
    } catch (error) {
      console.error("Error fetching lab doctors:", error);
      return NextResponse.json(
        { error: "Failed to fetch lab doctors" },
        { status: 500 }
      );
    }
  },
  ["admin", "labAdmin", "patient"]
);

// POST /api/labs/[id]/doctors - Add a new doctor to a lab
export const POST = withAuth(
  async (req, { params }) => {
    try {
      const { id } = params;
      const body = await req.json();
      const {
        name,
        specialization,
        experience,
        qualification,
        email,
        phone,
        address,
      } = body;

      // Validate required fields
      if (
        !name ||
        !specialization ||
        !experience ||
        !qualification ||
        !email ||
        !phone ||
        !address
      ) {
        return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        );
      }

      await connectDB();

      // Check if lab exists
      const lab = await Lab.findById(id);
      if (!lab) {
        return NextResponse.json({ error: "Lab not found" }, { status: 404 });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }

      // Create new doctor
      const doctor = await User.create({
        name,
        specialization,
        experience,
        qualification,
        email,
        mobile: phone, // Use phone as mobile
        address,
        role: "doctor",
        lab: id,
        isActive: true,
      });

      // Return created doctor without password
      const { password, ...doctorWithoutPassword } = doctor.toObject();
      return NextResponse.json(doctorWithoutPassword, { status: 201 });
    } catch (error) {
      console.error("Error creating doctor:", error);
      return NextResponse.json(
        { error: "Failed to create doctor" },
        { status: 500 }
      );
    }
  },
  ["admin", "labAdmin"]
);
