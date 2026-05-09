import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory stores
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
export const usersStore = new Map<string, {
  userId: string;
  name: string;
  phone: string;
  email: string;
  password: string;
}>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send Email OTP
export const sendEmailOTP = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string } }) => {
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(`email:${data.email}`, { otp, expiresAt });

    try {
      await resend.emails.send({
        from: "BharatID <onboarding@resend.dev>",
        to: data.email,
        subject: "Your BharatID Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a2e;">BharatID Verification</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing: 8px; font-size: 36px;">${otp}</h1>
            <p>This code expires in <strong>10 minutes</strong>.</p>
          </div>
        `,
      });
      return { success: true, message: "OTP sent successfully" };
    } catch (error) {
      return { success: false, message: "Failed to send OTP" };
    }
  }
);

// Send Phone OTP
export const sendPhoneOTP = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { phone: string } }) => {
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(`phone:${data.phone}`, { otp, expiresAt });

    try {
      const response = await fetch(
        `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&variables_values=${otp}&route=otp&numbers=${data.phone}`
      );
      if (response.ok) {
        return { success: true, message: "OTP sent successfully" };
      }
      return { success: false, message: "Failed to send OTP" };
    } catch (error) {
      return { success: false, message: "Failed to send OTP" };
    }
  }
);

// Verify Email OTP
export const verifyEmailOTP = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string; otp: string } }) => {
    const stored = otpStore.get(`email:${data.email}`);
    if (!stored) return { success: false, message: "OTP not found" };
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(`email:${data.email}`);
      return { success: false, message: "OTP expired" };
    }
    if (stored.otp !== data.otp) return { success: false, message: "Invalid OTP" };
    otpStore.delete(`email:${data.email}`);
    return { success: true, message: "Email verified!" };
  }
);

// Verify Phone OTP
export const verifyPhoneOTP = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { phone: string; otp: string } }) => {
    const stored = otpStore.get(`phone:${data.phone}`);
    if (!stored) return { success: false, message: "OTP not found" };
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(`phone:${data.phone}`);
      return { success: false, message: "OTP expired" };
    }
    if (stored.otp !== data.otp) return { success: false, message: "Invalid OTP" };
    otpStore.delete(`phone:${data.phone}`);
    return { success: true, message: "Phone verified!" };
  }
);

// Signup
export const signupUser = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { name: string; phone: string; email: string; password: string } }) => {
    const existingUser = Array.from(usersStore.values()).find(
      (u) => u.email === data.email
    );
    if (existingUser) return { success: false, message: "User already exists" };

    const userId = crypto.randomUUID();
    usersStore.set(userId, { userId, ...data });
    return { success: true, userId, name: data.name, message: "Signup successful" };
  }
);

// Login
export const loginUser = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string; password: string } }) => {
    const user = Array.from(usersStore.values()).find(
      (u) => u.email === data.email && u.password === data.password
    );
    if (!user) return { success: false, message: "Invalid email or password" };
    return { success: true, userId: user.userId, name: user.name, message: "Login successful" };
  }
);