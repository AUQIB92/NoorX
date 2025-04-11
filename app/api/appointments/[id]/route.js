import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/db";
import Appointment from "../../../../models/Appointment";
import Lab from "../../../../models/Lab";
import { withAuth } from "../../../../middleware/auth";

// Get a specific appointment
async function getAppointment(req, { params }) {
  try {
    await connectToDatabase();

    const { id } = params;
    const { user } = req;

    // Find the appointment
    const appointment = await Appointment.findById(id)
      .populate("patient_id", "name mobile address")
      .populate("doctor_id", "name specialization");

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this appointment
    if (
      (user.role === "patient" &&
        appointment.patient_id._id.toString() !== user.id) ||
      (user.role === "doctor" &&
        appointment.doctor_id._id.toString() !== user.id)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to view this appointment" },
        { status: 403 }
      );
    }

    return NextResponse.json({ appointment }, { status: 200 });
  } catch (error) {
    console.error("Get appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update appointment status
async function updateAppointmentStatus(req, { params }) {
  try {
    await connectToDatabase();

    const { id } = params;
    const { user } = req;
    const { status, notes } = await req.json();

    // Find the appointment
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to update this appointment
    if (
      (user.role === "patient" &&
        appointment.patient_id.toString() !== user.id) ||
      (user.role === "doctor" && appointment.doctor_id.toString() !== user.id)
    ) {
      return NextResponse.json(
        { error: "You do not have permission to update this appointment" },
        { status: 403 }
      );
    }

    // Patients can only cancel their appointments
    if (user.role === "patient" && status !== "cancelled") {
      return NextResponse.json(
        { error: "Patients can only cancel appointments" },
        { status: 403 }
      );
    }

    // Update appointment
    appointment.status = status;

    if (notes) {
      appointment.notes = notes;
    }

    await appointment.save();

    return NextResponse.json(
      {
        message: "Appointment updated successfully",
        appointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete appointment (admin only)
async function deleteAppointment(req, { params }) {
  try {
    await connectToDatabase();

    const { id } = params;

    // Find and delete the appointment
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Appointment deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = withAuth(getAppointment, ["admin", "doctor", "patient"]);
export const PATCH = withAuth(updateAppointmentStatus, [
  "admin",
  "doctor",
  "patient",
]);
export const DELETE = withAuth(deleteAppointment, [
  "admin",
  "doctor",
  "patient",
]);
