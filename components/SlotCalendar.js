import React, { useMemo } from 'react';
import { FaClock, FaRegCalendarAlt } from 'react-icons/fa';

// Formats time from 24h to 12h format
function formatTime(time24h) {
  if (!time24h || typeof time24h !== "string") {
    return "Invalid time";
  }

  try {
    const [hours, minutes] = time24h.split(":");
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return "Invalid time";

    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Invalid time";
  }
}

const SlotCalendar = ({ slots, onSlotSelect, selectedSlot, onEditSlot, onDeleteSlot, readOnly = false }) => {
  // Group slots by day
  const slotsByDay = useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const grouped = {};
    
    // Initialize days
    days.forEach(day => {
      grouped[day] = [];
    });
    
    // Group slots by day
    slots.forEach(slot => {
      if (grouped[slot.day]) {
        grouped[slot.day].push(slot);
      }
    });
    
    // Sort slots by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const [aHour, aMin] = a.start_time.split(':').map(Number);
        const [bHour, bMin] = b.start_time.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
      });
    });
    
    return grouped;
  }, [slots]);

  // Determine time of day for styling
  const getTimeOfDay = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  return (
    <div className="slot-calendar">
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {Object.entries(slotsByDay).map(([day, daySlots]) => (
          <div key={day} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FaRegCalendarAlt className="mr-2 text-blue-500" />
              {day}
            </h3>
            
            {daySlots.length === 0 ? (
              <div className="text-sm text-gray-500 italic py-3 text-center border-t border-dashed border-gray-200">
                No slots available
              </div>
            ) : (
              <div className="space-y-2">
                {daySlots.map((slot) => {
                  const timeOfDay = getTimeOfDay(slot.start_time);
                  const isSelected = selectedSlot && selectedSlot._id === slot._id;
                  
                  let bgColor;
                  switch (timeOfDay) {
                    case "morning":
                      bgColor = isSelected ? "bg-blue-100 border-blue-400" : "bg-blue-50 hover:bg-blue-100 border-transparent hover:border-blue-300";
                      break;
                    case "afternoon":
                      bgColor = isSelected ? "bg-orange-100 border-orange-400" : "bg-orange-50 hover:bg-orange-100 border-transparent hover:border-orange-300";
                      break;
                    case "evening":
                      bgColor = isSelected ? "bg-indigo-100 border-indigo-400" : "bg-indigo-50 hover:bg-indigo-100 border-transparent hover:border-indigo-300";
                      break;
                    default:
                      bgColor = isSelected ? "bg-gray-100 border-gray-400" : "bg-gray-50 hover:bg-gray-100 border-transparent hover:border-gray-300";
                  }

                  return (
                    <div
                      key={slot._id}
                      onClick={() => onSlotSelect && onSlotSelect(slot)}
                      className={`rounded-lg p-3 cursor-pointer transition-all border ${bgColor} ${slot.is_admin_only ? "border-l-4 border-l-green-500" : ""} ${!slot.is_available ? "opacity-50" : ""}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FaClock className={`mr-2 ${timeOfDay === "morning" ? "text-blue-500" : timeOfDay === "afternoon" ? "text-orange-500" : "text-indigo-500"}`} />
                          <span className="font-medium">
                            {formatTime(slot.start_time)}
                          </span>
                        </div>
                        
                        {!readOnly && (
                          <div className="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEditSlot && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSlot(slot);
                                }}
                                className="text-gray-500 hover:text-blue-600"
                              >
                                Edit
                              </button>
                            )}
                            {onDeleteSlot && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSlot(slot);
                                }}
                                className="text-gray-500 hover:text-red-600"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600">
                        {formatTime(slot.end_time)} · {slot.duration} min
                        {!slot.is_available && <span className="ml-2 text-red-500">(Unavailable)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlotCalendar; 