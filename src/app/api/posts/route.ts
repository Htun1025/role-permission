
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("GET /api/posts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get posts",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const image =
      typeof body.image === "string" && body.image.trim()
        ? body.image.trim()
        : null;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required",
        },
        { status: 400 },
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          message: "Description is required",
        },
        { status: 400 },
      );
    }

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        title,
        description,
        image,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Post created successfully",
        post,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/posts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create post",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const id = Number(body.id);

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const image =
      typeof body.image === "string" && body.image.trim()
        ? body.image.trim()
        : null;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Post ID is required",
        },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Title is required",
        },
        { status: 400 },
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          message: "Description is required",
        },
        { status: 400 },
      );
    }

    // Find post
    const existingPost = await prisma.post.findUnique({
      where: {
        id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          message: "Post not found",
        },
        { status: 404 },
      );
    }

    // Only owner can edit
    if (existingPost.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only edit your own post",
        },
        { status: 403 },
      );
    }

    const post = await prisma.post.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        image,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("PUT /api/posts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update post",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const id = Number(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Post ID is required",
        },
        { status: 400 },
      );
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Find post
    const existingPost = await prisma.post.findUnique({
      where: {
        id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          message: "Post not found",
        },
        { status: 404 },
      );
    }

    // ===============================
    // Admin OR Owner
    // ===============================

    const isAdmin = currentUser.role?.name === "ADMIN";

    const isOwner =
      existingPost.userId === currentUser.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to delete this post",
        },
        { status: 403 },
      );
    }

    // Delete
    await prisma.post.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/posts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete post",
      },
      { status: 500 },
    );
  }
}


