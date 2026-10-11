import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateWithPassword } from "@icra360/auth";
import { authConfig } from "./auth.config";

const attempts = new Map<string, { count: number; resetAt: number }>();

function allowAttempt(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  current.count += 1;
  return current.count <= 8;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Parola", type: "password" },
      },
      authorize: async (credentials) => {
        const email = typeof credentials.email === "string" ? credentials.email : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !password) {
          return null;
        }
        if (!allowAttempt(email.toLowerCase())) {
          return null;
        }
        const user = await authenticateWithPassword(email, password);
        return user;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.tenantId = user.tenantId;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub && token.tenantId) {
        session.user = {
          id: token.sub,
          tenantId: typeof token.tenantId === "string" ? token.tenantId : "",
          email: typeof token.email === "string" ? token.email : "",
          name: typeof token.name === "string" ? token.name : "",
          emailVerified: null,
        };
      }
      return session;
    },
  },
});
