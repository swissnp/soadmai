/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      name: string;
      email: string | null;
      image: string | null;
      isEmailVerified: boolean;
      isOnboarded: boolean;
      // sessionToken: string;
      // ...other properties
      // role: UserRole;
    };
  }

  interface User {
    id : string;
    name: string;
    email: string | null;
    image: string | null;
    emailVerified: string | null;
    isOnboarded: boolean;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        isEmailVerified: !!user.emailVerified,
        isOnboarded: user.isOnboarded,
      },
    }),
    signIn: ({ user }) => {
      if (!user.email?.endsWith("@student.chula.ac.th")) {
        return false;
      }
      return true;
    }
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
    })
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  theme: {
    colorScheme: "light", // "auto" | "dark" | "light"
    brandColor: "#ef9fbc", // Hex color code
    logo: "", // Absolute URL to image
    buttonText: "#2f2327" // Hex color code
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request', // (used for check email message)
  }
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
