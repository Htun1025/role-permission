import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(100),

  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),

  email: z.string().trim().email().max(255),

  password: z.string().min(8).max(72),

  role: z.string().trim().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    
    // 1. CHECK LOGIN
    

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    
    // 2. GET CURRENT USER
    

    const currentUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },

      select: {
        id: true,

        role: {
          select: {
            name: true,

            rolePermissions: {
              where: {
                resource: "USER",
              },

              select: {
                canCreate: true,
              },
            },
          },
        },

        userPermissions: {
          where: {
            resource: "USER",
          },

          select: {
            canCreate: true,
          },
        },
      },
    });

    
    // 3. USER NOT FOUND
    

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "Current user not found",
        },
        {
          status: 401,
        },
      );
    }

    
    // 4. ROLE PERMISSION
    

    const roleCanCreate =
      currentUser.role?.rolePermissions[0]?.canCreate ?? false;

    
    // 5. DIRECT USER PERMISSION
    

    const userPermission =
      currentUser.userPermissions[0];

    
    // 6. EFFECTIVE PERMISSION
    //
    // ADMIN = always allowed
    //
    // Direct UserPermission exists
    //   => use direct permission
    //
    // No direct permission
    //   => use RolePermission
    

const canCreateUser =
  currentUser.role?.name === "ADMIN" ||
  roleCanCreate ||
  (userPermission?.canCreate ?? false);

    if (!canCreateUser) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to create users.",
        },
        {
          status: 403,
        },
      );
    }

    
    // 9. READ BODY
    

    const body = await request.json();

    
    // 10. VALIDATE
    

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid user information",
        },
        {
          status: 400,
        },
      );
    }

    const {
      name,
      username,
      email,
      password,
      role,
    } = parsed.data;

    
    // 11. CHECK DUPLICATE
    

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username,
          },
          {
            email,
          },
        ],
      },

      select: {
        id: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          message:
            "Username or email already exists",
        },
        {
          status: 409,
        },
      );
    }

    
    // 12. FIND ROLE
    

    const roleDefinition =
      await prisma.roleDefinition.findUnique({
        where: {
          name: role,
        },

        select: {
          id: true,
          name: true,
          description: true,
        },
      });

    if (!roleDefinition) {
      return NextResponse.json(
        {
          message: `Role "${role}" not found`,
        },
        {
          status: 400,
        },
      );
    }

    
    // 13. HASH PASSWORD
    

    const hashedPassword = await hash(
      password,
      12,
    );

    
    // 14. CREATE USER
    

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,

        role: {
          connect: {
            id: roleDefinition.id,
          },
        },
      },

      select: {
        id: true,
        name: true,
        username: true,
        email: true,

        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },

        status: true,
        createdAt: true,
      },
    });

    
    // 15. SUCCESS
    

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create user error:",
      error,
    );

    return NextResponse.json(
      {
        message: "Server error",
      },
      {
        status: 500,
      },
    );
  }
}