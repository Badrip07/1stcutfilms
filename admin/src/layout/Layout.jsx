import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { setToken } from "../api.js";

const SITE_ORIGIN =
  import.meta.env.VITE_PUBLIC_SITE_ORIGIN || "http://localhost:5173";

export default function Layout() {
  function logout() {
    setToken(null);
    window.location.href = "/login";
  }

  return (
    <div className="container-fluid admin-shell">
      <div className="row g-0">
        <aside className="col-lg-2 admin-sidebar p-3 d-flex flex-column">
          <div className="d-flex align-items-center gap-2 mb-4 px-1">
            <img
              src={`${SITE_ORIGIN}/logos/logo1.png`}
              alt="Prites Photography"
              className="admin-logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="fw-bold small text-uppercase text-secondary">
              Admin
            </span>
          </div>
          <p className="text-uppercase small text-secondary mb-2 px-1 admin-nav-heading">
            Navigation
          </p>
          <nav className="nav flex-column gap-1 mb-auto">
            <NavLink end className="admin-nav-link text-decoration-none" to="/">
              Dashboard
            </NavLink>
            <NavLink className="admin-nav-link text-decoration-none" to="/home-content">
              Home content
            </NavLink>
            <NavLink className="admin-nav-link text-decoration-none" to="/about-content">
              About content
            </NavLink>
            <NavLink className="admin-nav-link text-decoration-none" to="/contact-content">
              Contact content
            </NavLink>
            <NavLink className="admin-nav-link text-decoration-none" to="/career-page">
              Career page
            </NavLink>
            <NavLink className="admin-nav-link text-decoration-none" to="/career-jobs">
              Career jobs
            </NavLink>
            <NavLink className="admin-nav-link text-decoration-none" to="/work">
              Work posts
            </NavLink>
          </nav>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm mt-4"
            onClick={logout}
          >
            Log out
          </button>
        </aside>
        <main className="col-lg-10 admin-main">
          <div className="admin-content p-3 p-lg-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
