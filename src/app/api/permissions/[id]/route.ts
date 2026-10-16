
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Validate Permission ID
function getPermissionId(id: string): number | null {
  const permissionId = Number(id);

  if (!Number.isSafeInteger(permissionId) || permissionId <= 0) {
    return null;
  }

  return permissionId;
}

// Check access: ADMIN has full access
async function canManagePermission(
  action: "canEdit" | "canDelete"
): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.id) {
    return false;
  }

  if (session.user.role === "ADMIN") {
    return true;
  }

  return hasPermission("PERMISSION", action);
}

// Update Permission
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const allowed = await canManagePermission("canEdit");

    if (!allowed) {
      return NextResponse.json(
        { message: "ခွင့်ပြုချက်မရှိပါ။" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const permissionId = getPermissionId(id);

    if (permissionId === null) {
      return NextResponse.json(
        { message: "Permission ID မှားယွင်းနေပါသည်။" },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Request Data မှားယွင်းနေပါသည်။" },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("name" in body) ||
      !("code" in body)
    ) {
      return NextResponse.json(
        { message: "Permission Name နှင့် Code ဖြည့်ပါ။" },
        { status: 400 }
      );
    }

    const { name, code } = body as {
      name: unknown;
      code: unknown;
    };

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      return NextResponse.json(
        { message: "Permission Name နှင့် Code ဖြည့်ပါ။" },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        name: name.trim(),
        code: code.trim(),
      },
    });

    return NextResponse.json({
      message: "Permission ကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။",
      permission,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      const code = (error as { code?: string }).code;

      if (code === "P2025") {
        return NextResponse.json(
          { message: "Permission ကို ရှာမတွေ့ပါ။" },
          { status: 404 }
        );
      }

      if (code === "P2002") {
        return NextResponse.json(
          {
            message:
              "Permission Name သို့မဟုတ် Code ရှိပြီးသားဖြစ်သည်။",
          },
          { status: 409 }
        );
      }
    }

    console.error("PUT /api/permissions/[id] error:", error);

    return NextResponse.json(
      { message: "Permission ပြင်ဆင်ရာတွင် အမှားဖြစ်ပွားခဲ့သည်။" },
      { status: 500 }
    );
  }
}

// Delete Permission
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const allowed = await canManagePermission("canDelete");

    if (!allowed) {
      return NextResponse.json(
        { message: "ခွင့်ပြုချက်မရှိပါ။" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const permissionId = getPermissionId(id);

    if (permissionId === null) {
      return NextResponse.json(
        { message: "Permission ID မှားယွင်းနေပါသည်။" },
        { status: 400 }
      );
    }

    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({
      message: "Permission ကို အောင်မြင်စွာ ဖျက်ပြီးပါပြီ။",
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      const code = (error as { code?: string }).code;

      if (code === "P2025") {
        return NextResponse.json(
          { message: "Permission ကို ရှာမတွေ့ပါ။" },
          { status: 404 }
        );
      }

      if (code === "P2003") {
        return NextResponse.json(
          {
            message:
              "အခြားဒေတာများနှင့် ချိတ်ဆက်ထားသောကြောင့် ဖျက်၍မရပါ။",
          },
          { status: 409 }
        );
      }
    }

    console.error("DELETE /api/permissions/[id] error:", error);

    return NextResponse.json(
      { message: "Permission ဖျက်ရာတွင် အမှားဖြစ်ပွားခဲ့သည်။" },
      { status: 500 }
    );
  }
}