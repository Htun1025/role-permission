"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Username သို့မဟုတ် Password မှားနေပါသည်။");
        return;
      }

      if (result.ok) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setError("Login မအောင်မြင်ပါ။");
      }
    } catch {
      setError("Login မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Image
            src="/logo.jpg"
            alt="Role Permission System Logo"
            width={180}
            height={180}
            priority
            className="login-logo-image"
          />
        </div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Approval Management System</p>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
            // disabled={loading || !username.trim() || !password}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
