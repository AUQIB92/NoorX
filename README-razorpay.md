# Razorpay Integration for Healthcare Appointment Booking

This document explains how the Razorpay payment gateway has been integrated into the healthcare appointment booking system.

## Overview

The integration allows patients to pay for their appointments online using the Razorpay payment gateway. The implementation includes:

1. A custom React hook (`useRazorpayPayment`) for managing Razorpay payments
2. API routes for creating orders and verifying payments
3. Integration with the appointment booking flow

## Files and Components

### 1. Custom Hook: `hooks/useRazorpayPayment.js`

This hook provides a clean interface for integrating Razorpay payments into any component. It handles:

- Loading the Razorpay script
- Creating payment orders
- Processing payments
- Verifying payment status

**Usage:**

```jsx
const { processPayment, isScriptLoaded, isProcessing } = useRazorpayPayment();

// Process a payment
processPayment({
  appointment,
  doctorDetails,
  serviceDetails,
  date,
  time,
  onSuccess: (data) => {
    // Handle successful payment
  },
  onError: (error) => {
    // Handle payment error
  },
  onCancel: () => {
    // Handle payment cancellation
  }
});
```

### 2. API Routes: `app/api/payments/razorpay/route.js`

This file contains the API routes for:

- `POST /api/payments/razorpay/create-order`: Creates a new Razorpay order
- `PUT /api/payments/razorpay/verify-payment`: Verifies a payment and updates the appointment status

### 3. Booking Page: `app/dashboard/patient/book/page-with-razorpay.js`

This is an enhanced version of the booking page that integrates the Razorpay payment flow. Key features:

- Multi-step booking process
- Option to choose between cash and online payment
- Seamless integration with Razorpay for online payments

## Implementation Details

### Payment Flow

1. **Create Appointment**: When a user confirms a booking with online payment, an appointment is created with `payment_status: "pending"`.

2. **Create Order**: A Razorpay order is created with the appointment details and amount.

3. **Process Payment**: The Razorpay checkout modal is opened for the user to complete the payment.

4. **Verify Payment**: After successful payment, the signature is verified on the server, and the appointment status is updated to `confirmed`.

5. **Notifications**: Confirmation notifications are sent via SMS and email.

### Security Considerations

- Payment verification is done on the server-side using HMAC SHA256 signature verification
- Sensitive payment details are never stored in the application
- All API routes are protected with authentication middleware

## Configuration

To use Razorpay in your environment, set the following environment variables:

```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

For testing, you can use the Razorpay test credentials:

```
RAZORPAY_KEY_ID=rzp_test_mWaBYCWHNbBLUr
RAZORPAY_KEY_SECRET=KKXAQbsEJdMhgzMMarWzyJQt
```

## Testing

To test the payment flow:

1. Use the test credentials provided by Razorpay
2. For test payments, use any of the [test card numbers provided by Razorpay](https://razorpay.com/docs/payments/payments/test-card-details/)
3. For UPI, use `success@razorpay` as the UPI ID

## Deployment Considerations

When deploying to production:

1. Replace the test credentials with production credentials
2. Ensure that the webhook URL is configured in the Razorpay dashboard
3. Implement additional error handling and logging for production use

## Future Enhancements

Potential improvements to the payment integration:

1. Add support for saved payment methods
2. Implement subscription payments for recurring appointments
3. Add support for partial payments and installments
4. Integrate with the clinic's financial management system