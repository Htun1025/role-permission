import Link from "next/link";
import "./home.css";

export default function HomePage() {
  return (
    <main className="home">
      <div className="home-card">
        <div className="home-icon">
          <i className="pi pi-shield" />
        </div>

        <h1 className="home-title">Approval Management System</h1>

        <p className="home-description">Maker – Checker System</p>

        <p className="home-subtitle">
          Manage requests, reviews, and approvals securely in one place.
        </p>

        <Link href="/login" className="login-link">
          <i className="pi pi-sign-in" />
          <span>Login</span>
        </Link>
      </div>
    </main>
  );
}
