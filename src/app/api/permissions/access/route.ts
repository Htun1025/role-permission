
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  if (!(await hasPermission("PERMISSION", "canView"))) {
    return NextResponse.json(
      { message: "Permission denied" },
      { status: 403 }
    );
  }

  const [canCreate, canEdit, canDelete] = await Promise.all([
    hasPermission("PERMISSION", "canCreate"),
    hasPermission("PERMISSION", "canEdit"),
    hasPermission("PERMISSION", "canDelete"),
  ]);

  return NextResponse.json({
    canCreate,
    canEdit,
    canDelete,
  });
}