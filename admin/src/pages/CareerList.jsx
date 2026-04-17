import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function CareerList() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    try {
      const data = await api("/admin/career-posts");
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
          <h1 className="h3 mb-1">Career posts</h1>
          <p className="text-secondary mb-0">
            Jobs shown on <code>/career</code> and <code>/career/:id</code>. Public URL uses legacy ID.
          </p>
        </div>
        <Link className="btn btn-accent" to="/career-jobs/new">
          + New job
        </Link>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="admin-card p-3 mb-3">
        <label className="form-label mb-1">Search</label>
        <input
          className="form-control"
          placeholder="Title, internal id, legacy id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="table-responsive admin-card">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Legacy URL id</th>
              <th>Sort</th>
              <th>Title</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  <code>{r.legacy_numeric_id}</code>
                </td>
                <td>{r.sort_order}</td>
                <td>{r.payload?.title || "—"}</td>
                <td className="text-end">
                  <Link className="btn btn-sm btn-outline-secondary" to={`/career-jobs/${r.id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="p-3 text-secondary small">No posts match.</div>
        ) : null}
      </div>
    </div>
  );
}
