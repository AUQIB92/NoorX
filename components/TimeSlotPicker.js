import React, { useMemo } from 'react';
import { FaClock, FaSun, FaCloudSun, FaMoon } from 'react-icons/fa';

const TimeSlotPicker = ({ availableSlots, selectedTime, onTimeSelect }) => {
  // Deduplicate slots based on time
  const uniqueSlots = useMemo(() => {
    const uniqueMap = new Map();
    
    // Only keep one slot for each unique time
    availableSlots.forEach(slot => {
      if (!uniqueMap.has(slot.time)) {
        uniqueMap.set(slot.time, slot);
      }
    });
    
    return Array.from(uniqueMap.values());
  }, [availableSlots]);
  
  // Group slots by period of day
  const morningSlots = uniqueSlots.filter(slot => slot.period === 'morning');
  const afternoonSlots = uniqueSlots.filter(slot => slot.period === 'afternoon');
  const eveningSlots = uniqueSlots.filter(slot => slot.period === 'evening');

  const renderTimeGroup = (title, slots, icon, gradientColors) => {
    if (slots.length === 0) return null;
    
    return (
      <div className="mb-6">
        <div className="flex items-center mb-4">
          {icon}
          <h3 className="text-lg font-medium text-gray-800 ml-2">{title}</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => onTimeSelect(slot.time, slot.id)}
              className={`relative p-3 text-sm font-medium rounded-lg transition-all transform ${
                selectedTime === slot.time
                  ? `bg-gradient-to-r ${gradientColors.selected} text-white shadow-lg scale-105`
                  : `bg-white border border-gray-200 hover:${gradientColors.hover}`
              } ${
                slot.isAdminAdded
                  ? "before:absolute before:w-1 before:h-full before:bg-green-500 before:left-0 before:top-0 before:rounded-l-lg"
                  : ""
              }`}
            >
              <div className="flex flex-col items-center">
                <FaClock className="mb-1" />
                {slot.time}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="time-slot-picker">
      {renderTimeGroup(
        "Morning", 
        morningSlots, 
        <FaSun className="text-yellow-500 text-xl" />, 
        {
          selected: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
          hover: "border-blue-300 bg-blue-50"
        }
      )}
      
      {renderTimeGroup(
        "Afternoon", 
        afternoonSlots, 
        <FaCloudSun className="text-orange-500 text-xl" />, 
        {
          selected: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
          hover: "border-orange-300 bg-orange-50"
        }
      )}
      
      {renderTimeGroup(
        "Evening", 
        eveningSlots, 
        <FaMoon className="text-indigo-500 text-xl" />, 
        {
          selected: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
          hover: "border-indigo-300 bg-indigo-50"
        }
      )}
      
      {uniqueSlots.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <FaClock className="mx-auto text-gray-400 text-3xl mb-3" />
          <h3 className="text-lg font-medium text-gray-700">No available slots</h3>
          <p className="text-gray-500 mt-2">
            The doctor is not available on this date. Please select a different date.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker; 