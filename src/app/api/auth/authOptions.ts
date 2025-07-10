import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import type { AuthOptions, SessionStrategy } from 'next-auth';

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
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
  },
  callbacks: {
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      if (user) {
        token.id = (user as any).id;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
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
}; 