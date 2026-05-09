import { Resend } from "resend";
import axios from "axios";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store (replace with database in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Generate 6 digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Email using Resend
export async function sendEmailOTP(email: string): Promise<boolean> {
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(`email:${email}`, { otp, expiresAt });

  try {
    await resend.emails.send({
      from: "BharatID <onboarding@resend.dev>",
      to: email,
      subject: "Your BharatID Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">BharatID Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #gold; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Email OTP error:", error);
    return false;
  }
}

// Send OTP via Phone using Fast2SMS
export async function sendPhoneOTP(phone: string): Promise<boolean> {
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(`phone:${phone}`, { otp, expiresAt });

  try {
    await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        variables_values: otp,
        route: "otp",
        numbers: phone,
      },
    });
    return true;
  } catch (error) {
    console.error("Phone OTP error:", error);
    return false;
  }
}

// Verify OTP
export function verifyOTP(key: string, otp: string): boolean {
  const stored = otpStore.get(key);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  if (stored.otp !== otp) return false;
  otpStore.delete(key); // OTP used, delete it
  return true;
}

export function verifyEmailOTP(email: string, otp: string): boolean {
  return verifyOTP(`email:${email}`, otp);
}

export function verifyPhoneOTP(phone: string, otp: string): boolean {
  return verifyOTP(`phone:${phone}`, otp);
}