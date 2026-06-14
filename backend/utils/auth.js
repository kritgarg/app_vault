import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
export const auth = betterAuth({

      emailAndPassword: { 
    enabled: true, 
  }, 
  
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    advanced: {
        disableOriginCheck: true, // Required for React Native/Expo requests which lack default Origin headers
        disableCSRFCheck: true,
    },
});