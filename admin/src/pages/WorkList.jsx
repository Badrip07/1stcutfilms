import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function WorkList() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  async function load() {
    try {
      const data = await api("/admin/work-posts");
      setRows(data);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    const categoryMatch = filter === "all" || r.category === filter;
    if (!categoryMatch) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      String(r.id).includes(q) ||
      String(r.legacy_numeric_id).includes(q) ||
      String(r.payload?.title || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Work posts</h1>
          <p className="text-secondary mb-0">
            CRUD for portfolio items (stored as JSON payloads).
          </p>
        </div>
        <Link className="btn btn-accent" to="/work/new">
          + New post
        </Link>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="admin-card p-3 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-lg-7">
            <label className="form-label mb-1">Search</label>
            <input
              className="form-control"
              placeholder="Search by title, ID, legacy ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="col-lg-5">
            <label className="form-label mb-1">Category</label>
            <div className="d-flex flex-wrap gap-2">
              {["all", "video", "photography", "3d", "ai"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm ${filter === cat ? "btn-accent" : "btn-outline-secondary"}`}
                  onClick={() => setFilter(cat)}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-secondary">
          Showing {filtered.length} of {rows.length} posts
        </small>
      </div>

      <div className="table-responsive admin-card">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Legacy #</th>
              <th>Title</th>
              <th>Sort</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  <span className="badge text-bg-secondary text-uppercase">
                    {r.category}
                  </span>
                </td>
                <td>{r.legacy_numeric_id}</td>
                <td>{r.payload?.title || "—"}</td>
                <td>{r.sort_order}</td>
                <td className="text-end">
                  <Link className="btn btn-sm btn-outline-light" to={`/work/${r.id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-4">
                  No posts match current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
