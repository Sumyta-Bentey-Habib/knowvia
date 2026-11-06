import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "./lib/prisma.js";

const trustedOrigins = [
  process.env.WEB_ORIGIN,
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
        returned: true,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
  },
});
