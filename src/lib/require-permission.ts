
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type PermissionResource =
  | "USER"
  | "REQUEST"
  | "ROLE"
  | "PERMISSION";

export async function requirePermission(
  resource: PermissionResource,
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    return session.user;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      userPermissions: {
        where: {
          resource,
        },
        select: {
          canView: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.userPermissions[0]?.canView) {
    redirect("/dashboard");
  }

  return user;
}