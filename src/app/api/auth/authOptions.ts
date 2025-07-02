import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import type { AuthOptions, SessionStrategy } from 'next-auth';

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;
        return { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
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
  },
 
}; 