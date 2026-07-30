import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Only initialize Twilio if credentials exist
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const getBaseUrl = () => {
  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://colocdz.com";
};

export const auth = betterAuth({
  baseURL: getBaseUrl(),
  secret: process.env.BETTER_AUTH_SECRET || "colocdz-secret-key-change-me-in-production-2026",
  trustedOrigins: [
    "http://localhost:3000",
    "https://colocdz.com",
    "https://www.colocdz.com",
    getBaseUrl(),
  ].filter(Boolean),
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  advanced: {
    disableOriginCheck: true,
    useSecureCookies: true,
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ password, hash }) => {
        return await bcrypt.compare(password, hash);
      }
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "873960820010-r65bcqgvgg5m805tle3kgqb8ghv8bdor.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
    },
  },
});
