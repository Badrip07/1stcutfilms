import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api.js";

const SITE_ORIGIN =
  import.meta.env.VITE_PUBLIC_SITE_ORIGIN || "http://localhost:5173";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      nav("/", { replace: true });
    } catch (err) {
      setError(
        err.message ||
          (typeof err.body === "object" && err.body?.error) ||
          "Login failed — is the API running on port 3000?"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="admin-card p-4 w-100" style={{ maxWidth: "420px" }}>
        <div className="text-center mb-4">
          <img
            src={`${SITE_ORIGIN}/logos/logo1.png`}
            alt="Prites Photography"
            className="admin-logo mb-2"
            style={{ maxHeight: "48px" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <h1 className="h4 mb-0">Sign in</h1>
          <p className="text-secondary small mb-0 mt-2">
            Content management — admins only
          </p>
        </div>
        <form onSubmit={onSubmit}>
          {error ? (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          ) : null}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-accent w-100"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {import.meta.env.DEV ? (
          <p className="text-secondary small mt-3 mb-0 text-center">
            Dev: run <code className="small">npm run seed --prefix server</code>
            , then sign in with <code className="small">ADMIN_EMAIL</code> /{" "}
            <code className="small">ADMIN_PASSWORD</code> from{" "}
            <code className="small">server/.env</code> (see{" "}
            <code className="small">server/.env.example</code>).
          </p>
        ) : null}
      </div>
    </div>
  );
}
