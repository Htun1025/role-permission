
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    const roleNames = [
      "ADMIN",
      "MAKER",
      "CHECKER",
      "APPROVER",
      "USER",
    ];

    const data = roleNames.map((role) => ({
      role,
      count: users.filter((user) => user.role?.name === role).length,
    }));

    return NextResponse.json({
      labels: data.map((item) => item.role),
      data: data.map((item) => item.count),
    });
  } catch (error) {
    console.error("User chart error:", error);

    return NextResponse.json(
      {
        error: "Failed to load user chart.",
      },
      {
        status: 500,
      },
    );
  }
}

