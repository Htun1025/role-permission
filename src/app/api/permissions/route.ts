
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  if (!(await hasPermission("PERMISSION", "canView"))) {
    return NextResponse.json(
      { message: "Permission denied" },
      { status: 403 }
    );
  }

  const permissions = await prisma.permission.findMany({
    orderBy: { id: "desc" },
  });

  return NextResponse.json(permissions);
}

export async function POST(request: Request) {
  if (!(await hasPermission("PERMISSION", "canCreate"))) {
    return NextResponse.json(
      { message: "Permission denied" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const code =
      typeof body.code === "string" ? body.code.trim() : "";

    if (
      !name ||
      !code ||
      name.length > 100 ||
      code.length > 100
    ) {
      return NextResponse.json(
        { message: "Valid name and code are required." },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: { name, code },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Permission name or code already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Unable to create permission." },
      { status: 500 }
    );
  }
}