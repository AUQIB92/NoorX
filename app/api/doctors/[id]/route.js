import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import User from "../../../../models/User";
import Appointment from "../../../../models/Appointment";
import { withAuth } from "../../../../middleware/auth";

// Get a doctor by ID
async function getDoctor(req, { params }) {
  try {
    await connectToDatabase();
    const doctorId = params.id;

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" }).select(
      "-otp -password"
    );

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ doctor }, { status: 200 });
  } catch (error) {
    console.error("Get doctor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a doctor (admin only)
async function updateDoctor(req, { params }) {
  try {
    await connectToDatabase();
    const doctorId = params.id;
    const { name, mobile, email, address, specialization, qualifications } =
      await req.json();

    // Validate required fields
    if (!name || !mobile || !email || !address || !specialization) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check if mobile number is already used by another user
    if (mobile !== doctor.mobile) {
      const existingUser = await User.findOne({
        mobile,
        _id: { $ne: doctorId },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Mobile number is already in use" },
          { status: 409 }
        );
      }
    }

    // Check if email is already used by another user
    if (email !== doctor.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: doctorId },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email address is already in use" },
          { status: 409 }
        );
      }
    }

    // Update doctor
    doctor.name = name;
    doctor.mobile = mobile;
    doctor.email = email;
    doctor.address = address;
    doctor.specialization = specialization;
    doctor.qualifications = qualifications;

    await doctor.save();

    return NextResponse.json(
      {
        message: "Doctor updated successfully",
        doctor: {
          id: doctor._id,
          name: doctor.name,
          mobile: doctor.mobile,
          email: doctor.email,
          specialization: doctor.specialization,
          qualifications: doctor.qualifications,
          address: doctor.address,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update doctor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a doctor (admin only)
async function deleteDoctor(req, { params }) {
  try {
    await connectToDatabase();
    const doctorId = params.id;

    // Check if doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Delete all appointments associated with this doctor
    await Appointment.deleteMany({ doctorId });

    // Delete the doctor
    await User.deleteOne({ _id: doctorId });

    return NextResponse.json(
      { message: "Doctor and associated appointments deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete doctor error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware to PUT and DELETE requests (admin only)
export const GET = getDoctor;
export const PUT = withAuth(updateDoctor, ["admin"]);
export const DELETE = withAuth(deleteDoctor, ["admin"]);
