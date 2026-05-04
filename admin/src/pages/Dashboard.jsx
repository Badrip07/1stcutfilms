import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api("/admin/work-posts");
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byCat = rows.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Dashboard</h1>
          <p className="text-secondary mb-0">
            Quick overview of portfolio content and shortcuts to frequent actions.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link className="btn btn-outline-secondary" to="/home-content">
            Edit home content
          </Link>
          <Link className="btn btn-outline-secondary" to="/about-content">
            Edit about content
          </Link>
          <Link className="btn btn-outline-secondary" to="/contact-content">
            Edit contact content
          </Link>
          <Link className="btn btn-outline-secondary" to="/career-page">
            Career page layout
          </Link>
          <Link className="btn btn-outline-secondary" to="/career-jobs">
            Career jobs
          </Link>
          <Link className="btn btn-accent" to="/work/new">
            + New work post
          </Link>
        </div>
      </div>

      {err ? <div className="alert alert-danger">{err}</div> : null}

      <div className="row g-3 mt-2">
        {["video", "photography"].map((cat) => (
          <div key={cat} className="col-md-3">
            <div className="admin-card p-3 admin-stat-card">
              <div className="text-secondary text-uppercase small">{cat}</div>
              <div className="display-6 fw-bold text-accent">
                {byCat[cat] ?? 0}
              </div>
              <div className="small text-secondary">posts</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card p-3 mt-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <div className="fw-semibold">Total work posts</div>
            <div className="text-secondary small">Across all categories</div>
          </div>
          <div className="display-6 fw-bold text-accent mb-0">{rows.length}</div>
        </div>
      </div>
    </div>
  );
}
