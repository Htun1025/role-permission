"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import "../app/globals.css";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await signOut({
        callbackUrl: "/login",
      });
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="logout-button"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
