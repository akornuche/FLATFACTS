import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma'; // Use the singleton
import { compare } from 'bcrypt';
import type { AuthOptions, SessionStrategy } from 'next-auth';
import { migrateWaitlistReviews } from '@/lib/waitlist';
import { sendOtpToUser } from '@/lib/otp';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma as any), // Use 'as any' to bypass potential type mismatch with singleton
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null; // Check if user exists and has password
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;
        return { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 24 * 60 * 60, // 60 days in seconds
  },
  callbacks: {
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      if (user) {
        token.id = (user as any).id;
        token.isAdmin = (user as any).isAdmin;
        token.name = (user as any).name; // Add name to JWT
        token.email = (user as any).email; // Add email to JWT
        token.image = (user as any).image; // Add image to JWT
        token.verified = (user as any).verified; // Add verified to JWT
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).name = token.name; // Add name to session
        (session.user as any).email = token.email; // Add email to session
        (session.user as any).image = token.image; // Add image to session
        (session.user as any).verified = token.verified; // Add verified to session
      }
      return session;
    },
    async signIn(params) {
      const { user, account, profile } = params;
      // Handle OAuth sign-in
      if (account?.provider === 'google' || account?.provider === 'apple') {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });

        let userAccounts: any[] = [];
        if (existingUser) {
          userAccounts = await prisma.account.findMany({
            where: { userId: existingUser.id }
          });
        }

        if (existingUser) {
          // User exists, update their account info if needed
          if (!userAccounts.find((acc: any) => acc.provider === account.provider)) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token ?? undefined,
                expires_at: account.expires_at ?? undefined,
                refresh_token: account.refresh_token ?? undefined,
                token_type: account.token_type ?? undefined,
                scope: account.scope ?? undefined,
                id_token: account.id_token ?? undefined,
                session_state: account.session_state ?? undefined,
              }
            });
          }
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async createUser(message) {
      if (!message.user.id) {
        console.error("Could not migrate waitlist reviews: user ID not found in createUser event.");
        return;
      }
      
      // The user object in the event message is minimal. Fetch the full user object from the DB.
      const newUser = await prisma.user.findUnique({
        where: { id: message.user.id },
      });

      if (!newUser) {
        console.error(`Could not find newly created user with ID: ${message.user.id}`);
        return;
      }

      console.log("New user created via OAuth:", newUser.email);
      // After a user is created via an OAuth provider, migrate their waitlist reviews.
      await migrateWaitlistReviews(newUser);

      // After creating the user, send OTP
      const otpResult = await sendOtpToUser(newUser);
       if (!otpResult.success) {
        console.error("Failed to send OTP after OAuth registration:", otpResult.error);
        // Consider whether to return an error or just log it.
        // For now, we'll log it and continue, as OTP sending failure shouldn't block registration.
      }
    },
  },
};
