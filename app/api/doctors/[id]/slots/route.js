import { NextResponse } from "next/server";
import connectToDatabase from "../../../../../lib/db";
import DoctorSlot from "../../../../../models/DoctorSlot";
import Appointment from "../../../../../models/Appointment";
import { withAuth } from "../../../../../middleware/auth";

// Get doctor slots for a specific date
async function getDoctorSlots(req, context) {
  try {
    // Add transaction tracking ID for debugging
    const requestId = Math.random().toString(36).substring(2, 10);
    console.log(`[${requestId}] Starting doctor slots request`);
    
    await connectToDatabase();

    // Get doctor ID from params
    const doctorId = context?.params?.id;
    if (!doctorId) {
      console.log(`[${requestId}] Missing doctor ID`);
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Initialize dateParam to null
    let dateParam = null;

    // Safely parse URL parameters if URL exists
    if (req.url) {
      try {
        const { searchParams } = new URL(req.url);
        dateParam = searchParams.get("date");
        console.log(`[${requestId}] Date parameter: ${dateParam}`);
      } catch (urlError) {
        console.error(`[${requestId}] Error parsing URL:`, urlError);
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
    }

    let query = { doctor_id: doctorId };
    console.log(`[${requestId}] Base query:`, query);

    // If date is provided, filter by date
    if (dateParam) {
      try {
      const date = new Date(dateParam);
        
        // Validate date is a valid date object
        if (isNaN(date.getTime())) {
          console.error(`[${requestId}] Invalid date parameter: ${dateParam}`);
          return NextResponse.json(
            { error: "Invalid date format" },
            { status: 400 }
          );
        }

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
        console.log(`[${requestId}] Day of week: ${dayOfWeek}`);

        // Create start and end date objects for the day
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

      // Query for slots with matching date OR matching day
      query = {
        doctor_id: doctorId,
        $or: [
          // Specific date slots (admin-added)
          {
            date: {
                $gte: startDate,
                $lte: endDate,
              },
          },
          // Regular weekly slots
          { day: dayOfWeek, date: null },
        ],
      };
        
        console.log(`[${requestId}] Query with date:`, JSON.stringify(query));
      } catch (dateError) {
        console.error(`[${requestId}] Error processing date:`, dateError);
        return NextResponse.json(
          { error: "Error processing date parameter" },
          { status: 400 }
        );
      }
    }

    // Get all slots that match the query
    let slots = [];
    try {
      slots = await DoctorSlot.find(query).sort({ start_time: 1 });
      console.log(`[${requestId}] Found ${slots.length} matching slots`);
    } catch (dbError) {
      console.error(`[${requestId}] Database error fetching slots:`, dbError);
      return NextResponse.json(
        { error: "Error fetching doctor slots" },
        { status: 500 }
      );
    }

    // If date is provided, check for booked appointments on that date
    if (dateParam) {
      try {
      const date = new Date(dateParam);
        
        // Create start and end date objects
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

      // Find all appointments for this doctor on this date
      const appointments = await Appointment.find({
        doctor_id: doctorId,
        date: {
            $gte: startDate,
            $lte: endDate,
        },
        status: { $in: ["pending", "confirmed"] },
      });

        console.log(`[${requestId}] Found ${appointments.length} existing appointments`);

        // Extract booked times with safer parsing
        const bookedTimes = [];
        for (const app of appointments) {
          try {
            // First try the safer approach - directly use the time field if it's in HH:MM format
            if (/^\d{1,2}:\d{2}$/.test(app.time)) {
              // Time is already in 24h format like "14:30"
              const [hours, minutes] = app.time.split(':').map(Number);
              bookedTimes.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
            } else {
              // Try to parse AM/PM format
              const timeMatch = app.time.match(/(\d+):(\d+)\s*([AP]M)?/i);
              if (timeMatch) {
                const [_, hoursStr, minutesStr, ampm] = timeMatch;
                let hours = parseInt(hoursStr, 10);
                const minutes = parseInt(minutesStr, 10);
                
                // Convert to 24-hour format if AM/PM is present
                const isPM = ampm && ampm.toUpperCase() === 'PM';
                if (isPM && hours < 12) hours += 12;
                if (!isPM && hours === 12) hours = 0;
                
                bookedTimes.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
              } else {
                console.warn(`[${requestId}] Could not parse time format for appointment: ${app._id}, time: ${app.time}`);
              }
            }
          } catch (timeParseError) {
            console.error(`[${requestId}] Error parsing appointment time:`, timeParseError, 'Time value:', app.time);
            // Continue with the next appointment
            continue;
          }
        }

        console.log(`[${requestId}] Booked times:`, bookedTimes);

      // Find specific date slots that are marked as booked
      const bookedSpecificSlots = await DoctorSlot.find({
        doctor_id: doctorId,
        date: {
            $gte: startDate,
            $lte: endDate,
        },
        is_available: false,
        booked_by: { $ne: null },
      });

      // Extract times from booked specific slots
      const bookedSpecificTimes = bookedSpecificSlots.map(
        (slot) => slot.start_time
      );

      // Combine all booked times
        const allBookedTimes = [...new Set([...bookedTimes, ...bookedSpecificTimes])];
        console.log(`[${requestId}] All booked times:`, allBookedTimes);

      // Filter out slots that are already booked
      const availableSlots = slots.filter((slot) => {
          // Skip invalid slots
          if (!slot || !slot.start_time) return false;

        // If it's a specific date slot that's already marked as booked, filter it out
        if (slot.date && (!slot.is_available || slot.booked_by)) {
          return false;
        }

        // For recurring slots (no specific date)
        if (!slot.date) {
          // Check if this time slot is booked for this specific date
          return !allBookedTimes.includes(slot.start_time);
        }

        // For specific date slots, check if they're booked
        return !allBookedTimes.includes(slot.start_time);
      });

      console.log(
          `[${requestId}] Returning ${availableSlots.length} available slots out of ${slots.length} total slots`
        );
        
        // Set cache control headers to prevent browser caching
        return NextResponse.json(
          { slots: availableSlots }, 
          { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store, max-age=0',
              'Pragma': 'no-cache'
            }
          }
        );
      } catch (processingError) {
        console.error(`[${requestId}] Error processing availability:`, processingError);
        return NextResponse.json(
          { error: "Error processing availability data" },
          { status: 500 }
        );
      }
    }
    
    // If no date filter, just return all slots
    console.log(`[${requestId}] Returning all ${slots.length} slots (no date filter)`);
    return NextResponse.json(
      { slots }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
  } catch (error) {
    // Generate a unique error ID for this occurrence
    const errorId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    console.error(`[ERROR_ID:${errorId}] Get doctor slots error:`, error);
    console.error(`[ERROR_ID:${errorId}] Error stack:`, error.stack);
    
    // Handle specific error types
    if (error.code === "ERR_INVALID_URL") {
      return NextResponse.json(
        { error: "Invalid URL provided. Please check your request.", errorId },
        { status: 400 }
      );
    }
    
    if (error.name === "CastError") {
      return NextResponse.json(
        { error: "Invalid ID format", errorId },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error", errorId, message: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// Export the handler function with authentication middleware
export const GET = withAuth(getDoctorSlots);

// Add additional error handling wrapper
export async function GET_errorHandled(req) {
  try {
    return await GET(req);
  } catch (error) {
    console.error("Unhandled GET error in doctor slots route:", error);
    return NextResponse.json(
      { error: "Internal server error in GET handler" },
      { status: 500 }
    );
  }
}
