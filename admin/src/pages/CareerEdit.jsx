import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

function emptyPayload() {
  return {
    title: "",
    description: "",
    listImage: "",
    subtitle: "",
    company: "",
    location: "",
    type: "",
    heroImage: "",
    aboutStudio: "",
    aboutRole: "",
    aboutRole2: "",
    whatYoullDo: [],
  };
}

function normalizePayload(raw = {}) {
  const lines = Array.isArray(raw.whatYoullDo)
    ? raw.whatYoullDo.map((s) => String(s || "").trim()).filter(Boolean)
    : raw.whatYoullDo
      ? [String(raw.whatYoullDo)]
      : [];
  return {
    title: String(raw.title || ""),
    description: String(raw.description || ""),
    listImage: String(raw.listImage || ""),
    subtitle: String(raw.subtitle || ""),
    company: String(raw.company || ""),
    location: String(raw.location || ""),
    type: String(raw.type || ""),
    heroImage: String(raw.heroImage || ""),
    aboutStudio: String(raw.aboutStudio || raw.aboutFramebrains || ""),
    aboutRole: String(raw.aboutRole || ""),
    aboutRole2: String(raw.aboutRole2 || ""),
    whatYoullDo: lines,
  };
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-2">
      <label className="form-label small mb-1">{label}</label>
      <input
        className="form-control"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 4 }) {
  return (
    <div className="mb-2">
      <label className="form-label small mb-1">{label}</label>
      <textarea
        className="form-control"
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function CareerEdit() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const nav = useNavigate();

  const [legacyId, setLegacyId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [payload, setPayload] = useState(() => normalizePayload(emptyPayload()));
  const [whatYoullDoText, setWhatYoullDoText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await api(`/admin/career-posts/${id}`);
        if (cancelled) return;
        setLegacyId(String(row.legacy_numeric_id));
        setSortOrder(row.sort_order);
        const n = normalizePayload(row.payload || {});
        setPayload(n);
        setWhatYoullDoText((n.whatYoullDo || []).join("\n"));
      } catch (e) {
        if (!cancelled) setError(e.message || "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  function pickFiles({ accept = "image/*", multiple = false } = {}) {
    return new Promise((resolve) => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = accept;
      picker.multiple = multiple;
      picker.onchange = () => resolve(Array.from(picker.files || []));
      picker.click();
    });
  }

  async function uploadFiles(files) {
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api("/admin/media", { method: "POST", body: fd });
      uploaded.push(res.url);
    }
    return uploaded;
  }

  async function uploadFileAndSet(setter) {
    try {
      setUploading(true);
      setError("");
      const files = await pickFiles({ accept: "image/*", multiple: false });
      if (!files.length) return;
      const urls = await uploadFiles([files[0]]);
      if (urls[0]) setter(urls[0]);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function buildPayloadForSave() {
    const lines = whatYoullDoText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return normalizePayload({ ...payload, whatYoullDo: lines });
  }

  async function save() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const body = buildPayloadForSave();
      const lid = Number.parseInt(legacyId, 10);
      if (Number.isNaN(lid)) {
        setError("Legacy URL id must be a number (used in /career/:id).");
        return;
      }
      if (isNew) {
        const res = await api("/admin/career-posts", {
          method: "POST",
          body: JSON.stringify({
            legacy_numeric_id: lid,
            sort_order: Number.parseInt(sortOrder, 10) || 0,
            payload: body,
          }),
        });
        setMessage("Created.");
        nav(`/career-jobs/${res.id}`);
        return;
      }
      await api(`/admin/career-posts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          legacy_numeric_id: lid,
          sort_order: Number.parseInt(sortOrder, 10) || 0,
          payload: body,
        }),
      });
      setMessage("Saved.");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h1 className="h3 mb-1">{isNew ? "New career post" : `Career post #${id}`}</h1>
          <p className="text-secondary mb-0 small">
            <Link to="/career-jobs">← Back to list</Link>
          </p>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Routing</h5>
        <div className="row g-2">
          <div className="col-md-4">
            <Field
              label="Legacy URL id (e.g. 1 → /career/1)"
              value={legacyId}
              onChange={setLegacyId}
            />
          </div>
          <div className="col-md-4">
            <Field
              label="Sort order (lower first)"
              value={String(sortOrder)}
              onChange={(v) => setSortOrder(Number.parseInt(v, 10) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Listing card (/career)</h5>
        <Field label="Title" value={payload.title} onChange={(v) => setPayload((p) => ({ ...p, title: v }))} />
        <TextAreaField
          label="Short description"
          rows={3}
          value={payload.description}
          onChange={(v) => setPayload((p) => ({ ...p, description: v }))}
        />
        <Field
          label="Card image URL"
          value={payload.listImage}
          onChange={(v) => setPayload((p) => ({ ...p, listImage: v }))}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() => uploadFileAndSet((url) => setPayload((p) => ({ ...p, listImage: url })))}
          disabled={uploading}
        >
          Upload card image
        </button>
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Job detail header</h5>
        <Field
          label="Subtitle (under title)"
          value={payload.subtitle}
          onChange={(v) => setPayload((p) => ({ ...p, subtitle: v }))}
        />
        <div className="row g-2">
          <div className="col-md-4">
            <Field
              label="Company (optional)"
              value={payload.company}
              onChange={(v) => setPayload((p) => ({ ...p, company: v }))}
            />
          </div>
          <div className="col-md-4">
            <Field
              label="Location"
              value={payload.location}
              onChange={(v) => setPayload((p) => ({ ...p, location: v }))}
            />
          </div>
          <div className="col-md-4">
            <Field
              label="Type (e.g. HYBRID)"
              value={payload.type}
              onChange={(v) => setPayload((p) => ({ ...p, type: v }))}
            />
          </div>
        </div>
        <Field
          label="Hero image URL (optional — uses career page default if empty)"
          value={payload.heroImage}
          onChange={(v) => setPayload((p) => ({ ...p, heroImage: v }))}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() => uploadFileAndSet((url) => setPayload((p) => ({ ...p, heroImage: url })))}
          disabled={uploading}
        >
          Upload hero image
        </button>
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Job body</h5>
        <TextAreaField
          label="About the studio"
          rows={4}
          value={payload.aboutStudio}
          onChange={(v) => setPayload((p) => ({ ...p, aboutStudio: v }))}
        />
        <TextAreaField
          label="About the role (paragraph 1)"
          rows={4}
          value={payload.aboutRole}
          onChange={(v) => setPayload((p) => ({ ...p, aboutRole: v }))}
        />
        <TextAreaField
          label="About the role (paragraph 2)"
          rows={4}
          value={payload.aboutRole2}
          onChange={(v) => setPayload((p) => ({ ...p, aboutRole2: v }))}
        />
        <TextAreaField
          label="What you'll do (one bullet per line)"
          rows={8}
          value={whatYoullDoText}
          onChange={(e) => setWhatYoullDoText(e.target.value)}
        />
      </div>

      <div className="d-flex gap-2 sticky-actions">
        <button type="button" className="btn btn-accent" onClick={save} disabled={busy}>
          {busy ? "Saving..." : isNew ? "Create" : "Save"}
        </button>
      </div>
    </div>
  );
}
