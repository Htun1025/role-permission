import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

type PermissionItem = {
  resource:
    | "USER"
    | "REQUEST"
    | "ROLE"
    | "PERMISSION";

  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
};

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },


  providers: [
    Credentials({
      credentials: {
        username: {
          label: "Username",
          type: "text",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsed = z
          .object({
            username: z
              .string()
              .trim()
              .min(1),

            password: z
              .string()
              .min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const {
          username,
          password,
        } = parsed.data;

        const user =
          await prisma.user.findUnique({
            where: {
              username,
            },

            include: {
              role: {
                include: {
                  rolePermissions: true,
                },
              },

              userPermissions: true,
            },
          });

        if (!user) {
          return null;
        }


        const valid = await compare(
          password,
          user.password,
        );

        if (!valid) {
          return null;
        }

        if (!user.role) {
          return null;
        }

        const rolePermissions: PermissionItem[] =
          user.role.rolePermissions.map(
            (permission) => ({
              resource: permission.resource,

              canView:
                permission.canView,

              canCreate:
                permission.canCreate,

              canEdit:
                permission.canEdit,

              canDelete:
                permission.canDelete,

              canApprove:
                permission.canApprove,

              canReject:
                permission.canReject,
            }),
          );

        const userPermissions: PermissionItem[] =
          user.userPermissions.map(
            (permission) => ({
              resource: permission.resource,

              canView:
                permission.canView,

              canCreate:
                permission.canCreate,

              canEdit:
                permission.canEdit,

              canDelete:
                permission.canDelete,

              canApprove:
                permission.canApprove,

              canReject:
                permission.canReject,
            }),
          );

        return {
          id: user.id,

          name: user.name,

          username: user.username,

          email: user.email,

          role: user.role.name,

          rolePermissions,

          userPermissions,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      user,
    }) {
      if (user) {
        token.sub = user.id;

        token.username =
          user.username ?? "";

        token.role =
          user.role ?? "";

        token.rolePermissions =
          user.rolePermissions ?? [];

        token.userPermissions =
          user.userPermissions ?? [];
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (session.user) {
        session.user.id =
          String(token.sub ?? "");

        session.user.username =
          String(
            token.username ?? "",
          );

        session.user.role =
          String(
            token.role ?? "",
          );

        const rolePermissions =
          Array.isArray(
            token.rolePermissions,
          )
            ? (
                token.rolePermissions as PermissionItem[]
              )
            : [];

        const userPermissions =
          Array.isArray(
            token.userPermissions,
          )
            ? (
                token.userPermissions as PermissionItem[]
              )
            : [];
        session.user.rolePermissions =
          rolePermissions;

        session.user.userPermissions =
          userPermissions;
      }

      return session;
    },
  },
});