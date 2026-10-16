
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    
    // Check Login
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    
    // Get Approver Role
    
    const approver =
      await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },

        select: {
          role: true,
        },
      });

    // Dynamic Role:
    // approver.role is RoleDefinition object
    // so we need approver.role.name
    if (
      !["ADMIN", "APPROVER"].includes(
        approver?.role?.name ?? ""
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Only ADMIN or APPROVER can approve or reject users",
        },
        {
          status: 403,
        }
      );
    }

    
    // Get User ID
    
    const { id } = await params;

    
    // Request Body
    
    const body = await req.json();

    const action = body.action;

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          message: "Invalid action",
        },
        {
          status: 400,
        }
      );
    }

    
    // Prevent Self Approval
    
    if (id === session.user.id) {
      return NextResponse.json(
        {
          message:
            "You cannot approve or reject yourself",
        },
        {
          status: 400,
        }
      );
    }

    
    // Update User Status
    
    const result =
      await prisma.user.updateMany({
        where: {
          id,
          status: "PENDING",
        },

        data: {
          status:
            action === "APPROVE"
              ? "APPROVED"
              : "REJECT",
        },
      });

    
    // User Not Found
    
    if (result.count === 0) {
      return NextResponse.json(
        {
          message:
            "User not found or already reviewed",
        },
        {
          status: 409,
        }
      );
    }

    
    // Success
    
    return NextResponse.json({
      message: `User ${action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    console.error(
      "User approval error:",
      error
    );

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}