import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { phoneNumber } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "",
  ].filter(Boolean),
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  advanced: {
    database: {
      generateId: false, // Let MongoDB generate ObjectIds
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    // Facebook: uncomment when you have HTTPS + credentials
    // facebook: {
    //   clientId: process.env.FACEBOOK_CLIENT_ID || "",
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    // },
  },
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // ─── DEV MODE BYPASS ───────────────────────────────────────────
        // In development, print OTP to terminal instead of sending SMS.
        // Switch to real Twilio when you upgrade your account for production.
        if (process.env.NODE_ENV !== 'production') {
          console.log('\n');
          console.log('╔══════════════════════════════════════╗');
          console.log('║       🔐  DEV MODE OTP CODE          ║');
          console.log(`║   Phone  : ${phoneNumber.padEnd(26)}║`);
          console.log(`║   Code   : ${code.padEnd(26)}║`);
          console.log('╚══════════════════════════════════════╝');
          console.log('\n');
          return; // skip Twilio
        }
        // ─── PRODUCTION: Send real SMS via Twilio ──────────────────────
        try {
          await twilioClient.messages.create({
            body: `Your ColocDZ verification code is: ${code}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
          });
          console.log(`OTP sent to ${phoneNumber}`);
        } catch (error) {
          console.error("Failed to send OTP via Twilio:", error);
          throw error;
        }
      },
    }),
  ]
});
