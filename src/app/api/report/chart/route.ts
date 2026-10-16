import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.request.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Chart API error:", error);

    return NextResponse.json(
      { error: "Failed to load chart data" },
      { status: 500 },
    );
  }
}