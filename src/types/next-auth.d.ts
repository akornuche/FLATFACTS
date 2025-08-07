import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean | null;
      verified?: boolean | null; // Add verified to Session user
    };
  }

  interface User {
    id: string;
    isAdmin?: boolean | null;
    verified?: boolean | null; 
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin?: boolean | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    verified?: boolean | null; 
  }
}
