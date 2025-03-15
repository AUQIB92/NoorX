import { useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

/**
 * Component to handle Razorpay payment integration
 * @param {Object} props - Component props
 * @param {Object} props.appointmentData - Appointment data
 * @param {Object} props.doctorDetails - Doctor details
 * @param {Object} props.serviceDetails - Service details
 * @param {string} props.selectedDate - Selected date
 * @param {string} props.selectedTime - Selected time
 * @param {Function} props.onSuccess - Callback on successful payment
 * @param {Function} props.onCancel - Callback on payment cancellation
 * @param {Function} props.onError - Callback on payment error
 */
const RazorpayPayment = ({
  appointmentData,
  doctorDetails,
  serviceDetails,
  selectedDate,
  selectedTime,
  onSuccess,
  onCancel,
  onError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const initiatePayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      
      // Create Razorpay order
      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: serviceDetails?.price || 0,
          appointmentData: {
            id: appointmentData._id,
            patientName: appointmentData.patient_name,
            doctorName: doctorDetails.name,
            service: serviceDetails.name,
            date: selectedDate,
            time: selectedTime,
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Initialize Razorpay payment
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Dr. Imran's Healthcare",
        description: `Appointment with ${doctorDetails.name} for ${serviceDetails.name}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyRes = await fetch("/api/payments/razorpay/verify-payment", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                appointmentId: appointmentData._id,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              if (onSuccess) onSuccess(verifyData);
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            if (onError) onError(error);
            else toast.error(error.message || "An error occurred during payment verification");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: appointmentData.patient_name,
          email: appointmentData.patient_email,
          contact: appointmentData.patient_mobile,
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function() {
            if (onCancel) onCancel();
            else toast.info("Payment cancelled. You can complete payment later.");
            setIsProcessing(false);
          }
        }
      };

      // Check if Razorpay is loaded
      if (window.Razorpay) {
        // Open Razorpay payment form
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.error("Razorpay payment gateway is not available. Please try again later.");
        setIsProcessing(false);
        if (onError) onError(new Error("Razorpay not loaded"));
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error(error.message || "An error occurred. Please try again.");
      setIsProcessing(false);
      if (onError) onError(error);
    }
  };

  return { initiatePayment, isProcessing };
};

export default RazorpayPayment; 