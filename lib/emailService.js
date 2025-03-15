/**
 * Email Service for OTP delivery and notifications
 * This file contains functions to send emails using Nodemailer
 */

import nodemailer from 'nodemailer';
import { generateOTP } from './utils';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: process.env.EMAIL_FROM || 'noreply@healthcare.com',
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: EMAIL_CONFIG.auth,
  });
};

/**
 * Generic function to send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @returns {Promise<object>} - Result of the email sending operation
 */
export async function sendEmail(to, subject, htmlContent) {
  try {
    // Create transporter
    const transporter = createTransporter();
    
    // Prepare email content
    const mailOptions = {
      from: `"Dr. Imran's Healthcare" <${EMAIL_CONFIG.from}>`,
      to,
      subject,
      html: htmlContent,
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
    
    // For development, return success even if email fails
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV MODE] Returning success despite email failure');
      return { success: true };
    }
    
    throw emailError;
  }
}

/**
 * Send OTP via Email
 * @param {string} email - The recipient's email address
 * @param {string} userName - The user's name
 * @param {string} otp - The OTP to send (if not provided, a new one will be generated)
 * @returns {Promise<{success: boolean, otp?: string, error?: string}>}
 */
export async function sendEmailOTP(email, userName, otp = null) {
  try {
    // Generate OTP if not provided
    const otpCode = otp || generateOTP(6);
    
    // Log for debugging
    console.log(`Sending OTP email to ${email}: ${otpCode}`);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Prepare email content
    const mailOptions = {
      from: `"Healthcare Center" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="background-color: #0d9488; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Healthcare Center</h1>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hello ${userName},</p>
            <p style="font-size: 16px;">Thank you for registering with our Healthcare Center. To complete your registration, please use the following verification code:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h2 style="font-size: 28px; letter-spacing: 5px; margin: 0; color: #0d9488;">${otpCode}</h2>
            </div>
            <p style="font-size: 16px;">This code will expire in 10 minutes.</p>
            <p style="font-size: 16px;">If you didn't request this code, please ignore this email.</p>
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>Healthcare Center Team</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    };
    
    try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, otp: otpCode };
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // For development, return success even if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV MODE] Returning success despite email failure');
        return { success: true, otp: otpCode };
      }
      
      throw emailError;
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: 'Failed to send email. Please try again.' 
    };
  }
}

/**
 * Verify OTP sent via Email
 * @param {string} email - The user's email
 * @param {string} userOtp - The OTP entered by the user
 * @param {string} storedOtp - The OTP stored in the database/session
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function verifyEmailOTP(email, userOtp, storedOtp) {
  try {
    // Simple verification - compare the OTPs
    if (userOtp === storedOtp) {
      return { success: true };
    }
    
    return { 
      success: false, 
      error: 'Invalid OTP. Please try again.' 
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { 
      success: false, 
      error: 'An error occurred during verification' 
    };
  }
}

/**
 * Send a welcome email after successful registration
 * @param {string} email - The recipient's email address
 * @param {string} userName - The user's name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendWelcomeEmail(email, userName) {
  try {
    // Log for debugging
    console.log(`Sending welcome email to ${email}`);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Prepare email content
    const mailOptions = {
      from: `"Healthcare Center" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: 'Welcome to Healthcare Center',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="background-color: #0d9488; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Healthcare Center</h1>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hello ${userName},</p>
            <p style="font-size: 16px;">Welcome to Healthcare Center! Your account has been successfully created.</p>
            <p style="font-size: 16px;">You can now log in to your account and start booking appointments with our healthcare professionals.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
            </div>
            <p style="font-size: 16px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>Healthcare Center Team</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    };
    
    try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true };
    } catch (emailError) {
      console.error('Welcome email sending failed:', emailError);
      
      // For development, return success even if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV MODE] Returning success despite email failure');
        return { success: true };
      }
      
      throw emailError;
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: 'Failed to send welcome email' 
    };
  }
}

/**
 * Send booking confirmation email
 * @param {string} email - Recipient email address
 * @param {string} patientName - The patient's name
 * @param {object} data - Booking data including appointmentId, doctorName, serviceName, date, time, amount, paymentMethod, paymentId, notes
 * @returns {Promise<object>} - Result of the email sending operation
 */
export async function sendBookingConfirmationEmail(email, patientName, data) {
  try {
    console.log("Sending booking confirmation email to:", email);
    console.log("Email data:", JSON.stringify(data));
    
    // Create transporter
    const transporter = createTransporter();
    
    // Format date for display
    const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create email content with all appointment details
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0;">Appointment Confirmed</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${patientName || 'Patient'},</p>
          
          <p>Your appointment has been confirmed. Here are the details:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Doctor:</strong> ${data.doctorName || 'Not specified'}</p>
            ${data.doctorSpecialization ? `<p style="margin: 10px 0;"><strong>Specialization:</strong> ${data.doctorSpecialization}</p>` : ''}
            <p style="margin: 10px 0;"><strong>Service:</strong> ${data.serviceName || 'Not specified'}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate || 'Not specified'}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${data.time || 'Not specified'}</p>
            <p style="margin: 10px 0;"><strong>Amount:</strong> ₹${data.amount || '0'}</p>
            <p style="margin: 10px 0;"><strong>Payment Method:</strong> ${data.paymentMethod === 'online' ? 'Online (Paid)' : 'Cash (Pay at clinic)'}</p>
            ${data.paymentId ? `<p style="margin: 10px 0;"><strong>Payment ID:</strong> ${data.paymentId}</p>` : ''}
            <p style="margin: 10px 0;"><strong>Appointment ID:</strong> ${data.appointmentId || 'Not available'}</p>
            ${data.notes && data.notes !== 'None' ? `<p style="margin: 10px 0;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
          </div>
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1e40af;">Important Information</h3>
            <ul style="padding-left: 20px; color: #1e40af;">
              <li>Please arrive 15 minutes before your appointment time.</li>
              <li>Bring any relevant medical records or test results.</li>
              <li>If you need to cancel or reschedule, please do so at least 24 hours in advance.</li>
              <li>Wear a mask and follow COVID-19 safety protocols during your visit.</li>
            </ul>
          </div>
          
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #065f46;">Location</h3>
            <p style="margin: 5px 0; color: #065f46;"><strong>Dr. Imran's Healthcare Center</strong></p>
            <p style="margin: 5px 0; color: #065f46;">123 Medical Avenue, Srinagar</p>
            <p style="margin: 5px 0; color: #065f46;">Jammu & Kashmir, India</p>
          </div>
          
          <p>If you have any questions or need to make changes to your appointment, please contact us at +91 12345 67890 or reply to this email.</p>
          
          <p>Thank you for choosing Dr. Imran's Healthcare.</p>
          
          <p>Best regards,<br>Dr. Imran's Healthcare Team</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px;">
          <p>This is an automated email. Please do not reply directly to this message.</p>
          <p>© 2023 Dr. Imran's Healthcare. All rights reserved.</p>
        </div>
      </div>
    `;
    
    // Send the email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Appointment Confirmation - Dr. Imran's Healthcare",
      html: emailContent,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log("Booking confirmation email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return { success: false, error: error.message };
  }
} 