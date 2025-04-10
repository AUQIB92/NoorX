/**
 * Utility functions for generating doctor slots
 */

// Generate time slots for a specific time range
export function generateTimeSlotsForRange(
  startHour,
  startMinute,
  endHour,
  endMinute,
  slotDuration = 15
) {
  const slots = [];

  // Convert everything to minutes for easier calculation
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  const totalMinutes = endTimeInMinutes - startTimeInMinutes;

  // Calculate number of slots
  const totalSlots = Math.floor(totalMinutes / slotDuration);

  for (let i = 0; i < totalSlots; i++) {
    const slotStartMinutes = startTimeInMinutes + i * slotDuration;
    const slotEndMinutes = slotStartMinutes + slotDuration;

    const startHour = Math.floor(slotStartMinutes / 60);
    const startMinute = slotStartMinutes % 60;

    const endHour = Math.floor(slotEndMinutes / 60);
    const endMinute = slotEndMinutes % 60;

    const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute
      .toString()
      .padStart(2, "0")}`;
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute
      .toString()
      .padStart(2, "0")}`;

    slots.push({
      start_time: startTime,
      end_time: endTime,
      duration: slotDuration,
    });
  }

  return slots;
}

// Generate default slots for a doctor
export function generateDefaultDoctorSlots(doctorId) {
  const workingDays = ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"];
  const slots = [];

  // Generate early morning slots (6:30 AM to 9:00 AM) - Default to Admin only
  const earlyMorningSlots = generateTimeSlotsForRange(6, 30, 9, 0, 15); // Explicitly use 15 minutes

  // Generate morning slots (9:00 AM to 1:00 PM)
  const morningSlots = generateTimeSlotsForRange(9, 0, 13, 0, 15); // Explicitly use 15 minutes

  // Generate afternoon slots (2:00 PM to 7:00 PM)
  const afternoonSlots = generateTimeSlotsForRange(14, 0, 19, 0, 15); // Explicitly use 15 minutes

  // Combine all slots (with lunch break from 1:00 PM to 2:00 PM)
  const allSlots = [...earlyMorningSlots, ...morningSlots, ...afternoonSlots];

  // Use a set to keep track of unique time combinations per day
  const uniqueSlotKeys = new Set();
  
  workingDays.forEach((day) => {
    allSlots.forEach((slot, index) => {
      // Create a unique key for this day and time combination
      const slotKey = `${day}-${slot.start_time}-${slot.end_time}`;
      
      // Only add the slot if we haven't seen this combination before
      if (!uniqueSlotKeys.has(slotKey)) {
        // First 10 slots (early morning) are admin-only by default
        const isAdminOnly = index < earlyMorningSlots.length;
        
        slots.push({
          doctor_id: doctorId,
          day,
          start_time: slot.start_time,
          end_time: slot.end_time,
          duration: 15, // Ensure duration is always 15 minutes
          is_available: true,
          is_admin_only: isAdminOnly,
          date: null, // Explicitly set date to null
        });
        
        // Add the key to the set to prevent duplicates
        uniqueSlotKeys.add(slotKey);
      }
    });
  });

  return slots;
}

// Format time for display (convert 24h to 12h format)
export function formatTime(time24h) {
  if (!time24h) {
    return ""; // Return empty string if time is undefined or null
  }

  const [hour, minute] = time24h.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

// Get day name from date
export function getDayName(date) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}

// Check if a day is a working day
export function isWorkingDay(day) {
  return ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"].includes(day);
}
