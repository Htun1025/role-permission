
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  checkerNote: z.string().trim().max(1000).optional(),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: Context,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const parsed = reviewSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid review information" },
        { status: 400 },
      );
    }

    const { action, checkerNote } = parsed.data;

    // Dynamic RoleDefinition relation
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },

        userPermissions: {
          where: {
            resource: "REQUEST",
          },
          select: {
            canApprove: true,
            canReject: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 401 },
      );
    }

    const permission = user.userPermissions[0];

    const isAdmin = user.role?.name === "ADMIN";

    const allowed =
      isAdmin ||
      (action === "APPROVE"
        ? permission?.canApprove === true
        : permission?.canReject === true);

    if (!allowed) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to review requests",
        },
        { status: 403 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.request.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!existing) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      if (existing.status !== "PENDING") {
        throw new Error("REQUEST_NOT_PENDING");
      }

      // Conditional update prevents reviewing
      // an already reviewed request.
      const updated = await tx.request.updateMany({
        where: {
          id,
          status: "PENDING",
        },
        data: {
          status:
            action === "APPROVE"
              ? "APPROVED"
              : "REJECTED",

          checkerId: user.id,

          checkerNote: checkerNote ?? null,
        },
      });

      if (updated.count !== 1) {
        throw new Error("REQUEST_NOT_PENDING");
      }

      return tx.request.findUnique({
        where: {
          id,
        },
        include: {
          maker: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },

          checker: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      message:
        action === "APPROVE"
          ? "Request approved successfully"
          : "Request rejected successfully",

      request: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "REQUEST_NOT_FOUND") {
        return NextResponse.json(
          {
            message: "Request not found",
          },
          {
            status: 404,
          },
        );
      }

      if (error.message === "REQUEST_NOT_PENDING") {
        return NextResponse.json(
          {
            message:
              "This request is no longer pending",
          },
          {
            status: 409,
          },
        );
      }
    }

    console.error(
      "Review request error:",
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
