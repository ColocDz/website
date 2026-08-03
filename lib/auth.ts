import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const getBaseUrl = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://colocdz.com";
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
    provider: "mongodb",
  }),
  user: {
    additionalFields: {
      lastName: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      gender: {
        type: "string",
        required: false,
      },
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
    disableOriginCheck: true,
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
      redirectURI: process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl()}/api/auth/callback/google`,
    },
  },
});
