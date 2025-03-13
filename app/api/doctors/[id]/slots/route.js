import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/db";
import DoctorSlot from "../../../../../models/DoctorSlot";
import Appointment from "../../../../../models/Appointment";
import { withAuth } from "../../../../../middleware/auth";

// Get doctor slots for a specific date
async function getDoctorSlots(req, { params }) {
  try {
    await connectToDatabase();

    const doctorId = params?.id;
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    let query = { doctor_id: doctorId };

    // If date is provided, filter by date
    if (dateParam) {
      const date = new Date(dateParam);

      // Get day of week for the selected date
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dayOfWeek = days[date.getDay()];

      // Query for slots with matching date OR matching day
      query = {
        doctor_id: doctorId,
        $or: [
          // Specific date slots (admin-added)
          {
            date: {
              $gte: new Date(date.setHours(0, 0, 0, 0)),
              $lte: new Date(date.setHours(23, 59, 59, 999)),
            },
          },
          // Regular weekly slots
          { day: dayOfWeek, date: null },
        ],
      };
    }

    // Get all slots that match the query
    const slots = await DoctorSlot.find(query).sort({ start_time: 1 });

    // If date is provided, check for booked appointments on that date
    if (dateParam) {
      const date = new Date(dateParam);

      // Find all appointments for this doctor on this date
      const appointments = await Appointment.find({
        doctor_id: doctorId,
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        },
        status: { $in: ["pending", "confirmed"] },
      });

      // Extract booked times
      const bookedTimes = appointments.map((app) => {
        // Extract hours and minutes from the time string (e.g., "10:00 AM")
        const [hours, minutes] = app.time
          .match(/(\d+):(\d+)\s*([AP]M)/i)
          .slice(1, 3)
          .map(Number);
        const isPM = app.time.toUpperCase().includes("PM");

        // Convert to 24-hour format
        let hour24 = hours;
        if (isPM && hours < 12) hour24 += 12;
        if (!isPM && hours === 12) hour24 = 0;

        // Format as HH:MM for comparison
        return `${hour24.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      });

      console.log(
        `Booked times for doctor ${doctorId} on ${dateParam}:`,
        bookedTimes
      );

      // Find specific date slots that are marked as booked
      const bookedSpecificSlots = await DoctorSlot.find({
        doctor_id: doctorId,
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        },
        is_available: false,
        booked_by: { $ne: null },
      });

      // Extract times from booked specific slots
      const bookedSpecificTimes = bookedSpecificSlots.map(
        (slot) => slot.start_time
      );

      console.log(
        `Booked specific slots for doctor ${doctorId} on ${dateParam}:`,
        bookedSpecificTimes
      );

      // Combine all booked times
      const allBookedTimes = [
        ...new Set([...bookedTimes, ...bookedSpecificTimes]),
      ];

      // Filter out slots that are already booked
      const availableSlots = slots.filter((slot) => {
        // If it's a specific date slot that's already marked as booked, filter it out
        if (slot.date && (!slot.is_available || slot.booked_by)) {
          return false;
        }

        // For recurring slots (no specific date)
        if (!slot.date) {
          // Check if this time slot is booked for this specific date
          // We don't want to permanently mark recurring slots as unavailable
          return !allBookedTimes.includes(slot.start_time);
        }

        // For specific date slots, check if they're booked
        return !allBookedTimes.includes(slot.start_time);
      });

      console.log(
        `Returning ${availableSlots.length} available slots out of ${slots.length} total slots`
      );
      return NextResponse.json({ slots: availableSlots }, { status: 200 });
    }

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("Get doctor slots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export the handler function with authentication middleware
export const GET = withAuth(getDoctorSlots);
