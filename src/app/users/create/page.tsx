import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CreateUser from "./CreateUser";

export default async function CreateUserPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return <CreateUser />;
}
