import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

const emptyPayload = {
  title: "",
  subtitle: "",
  category: "",
  content: "",
  vimeoUrl: "",
  bunnyUrl: "",
  brandImage: "",
  image: "",
  thumbnail: "",
  campaignStills: [],
  additionalContent: [],
};

function normalizePayload(raw = {}) {
  return {
    title: String(raw.title || ""),
    subtitle: String(raw.subtitle || ""),
    category: String(raw.category || ""),
    content: String(raw.content || ""),
    vimeoUrl: String(raw.vimeoUrl || ""),
    bunnyUrl: String(raw.bunnyUrl || ""),
    brandImage: String(raw.brandImage || ""),
    image: String(raw.image || ""),
    thumbnail: String(raw.thumbnail || ""),
    campaignStills: Array.isArray(raw.campaignStills)
      ? raw.campaignStills
          .map((u) => String(typeof u === "string" ? u : u?.url || "").trim())
          .filter(Boolean)
      : [],
    additionalContent: Array.isArray(raw.additionalContent)
      ? raw.additionalContent
          .map((item) => ({ vimeoUrl: String(item?.vimeoUrl || "") }))
          .filter((item) => item.vimeoUrl)
      : [],
  };
}

function payloadToJson(payloadForm) {
  const next = { ...payloadForm };
  if (!next.additionalContent?.length) delete next.additionalContent;
  if (!next.campaignStills?.length) delete next.campaignStills;
  return next;
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input
        className="form-control"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <textarea
        className="form-control"
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function WorkEdit() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const nav = useNavigate();

  const [category, setCategory] = useState("video");
  const [legacyId, setLegacyId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(emptyPayload, null, 2)
  );
  const [payloadForm, setPayloadForm] = useState(() => normalizePayload(emptyPayload));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jsonValid, setJsonValid] = useState(true);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await api(`/admin/work-posts/${id}`);
        if (cancelled) return;
        setCategory(row.category);
        setLegacyId(String(row.legacy_numeric_id));
        setSortOrder(row.sort_order);
        const normalized = normalizePayload(row.payload || {});
        setPayloadForm(normalized);
        setJsonText(JSON.stringify(payloadToJson(normalized), null, 2));
      } catch (e) {
        if (!cancelled) setError(e.message || "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  function updatePayload(nextUpdater) {
    setPayloadForm((prev) => {
      const next =
        typeof nextUpdater === "function" ? nextUpdater(prev) : { ...prev, ...nextUpdater };
      setJsonText(JSON.stringify(payloadToJson(next), null, 2));
      setJsonValid(true);
      return next;
    });
    setMessage("");
  }

  function loadFieldsFromJson() {
    try {
      const parsed = JSON.parse(jsonText);
      const normalized = normalizePayload(parsed);
      setPayloadForm(normalized);
      setJsonText(JSON.stringify(payloadToJson(normalized), null, 2));
      setJsonValid(true);
      setMessage("Fields updated from JSON");
      setError("");
    } catch {
      setJsonValid(false);
      setError("JSON is invalid. Fix JSON first, then load fields.");
    }
  }

  async function pickAndUpload(targetKey) {
    try {
      setUploading(true);
      setError("");
      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = "image/*,video/*";
      picker.click();
      const file = await new Promise((resolve) => {
        picker.onchange = () => resolve(picker.files?.[0] || null);
      });
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      const res = await api("/admin/media", { method: "POST", body: fd });
      updatePayload((p) => ({ ...p, [targetKey]: res.url || "" }));
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function pickAndUploadCampaignStill(index) {
    try {
      setUploading(true);
      setError("");
      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = "image/*";
      picker.click();
      const file = await new Promise((resolve) => {
        picker.onchange = () => resolve(picker.files?.[0] || null);
      });
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      const res = await api("/admin/media", { method: "POST", body: fd });
      const url = res.url || "";
      updatePayload((p) => {
        const list = [...(p.campaignStills || [])];
        while (list.length <= index) list.push("");
        list[index] = url;
        return { ...p, campaignStills: list };
      });
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError("");
    setMessage("");
    setBusy(true);
    let payload;
    try {
      payload = JSON.parse(jsonText);
      setJsonValid(true);
    } catch {
      setError("Payload must be valid JSON");
      setJsonValid(false);
      setBusy(false);
      return;
    }
    if (Array.isArray(payload.campaignStills)) {
      payload.campaignStills = payload.campaignStills
        .map((u) => String(u ?? "").trim())
        .filter(Boolean);
      if (!payload.campaignStills.length) delete payload.campaignStills;
    }
    try {
      if (isNew) {
        const lid = Number.parseInt(legacyId, 10);
        if (Number.isNaN(lid)) {
          setError("Legacy numeric id must be a number");
          setBusy(false);
          return;
        }
        const res = await api("/admin/work-posts", {
          method: "POST",
          body: JSON.stringify({
            category,
            legacy_numeric_id: lid,
            sort_order: Number.parseInt(sortOrder, 10) || 0,
            payload,
          }),
        });
        setMessage("Created");
        nav(`/work/${res.id}`, { replace: true });
      } else {
        await api(`/admin/work-posts/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            category,
            legacy_numeric_id: Number.parseInt(legacyId, 10),
            sort_order: Number.parseInt(sortOrder, 10) || 0,
            payload,
          }),
        });
        setMessage("Saved");
      }
    } catch (e) {
      setError(e.body?.error || e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function formatJson() {
    setError("");
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonValid(true);
      setMessage("JSON formatted");
    } catch {
      setJsonValid(false);
      setError("Cannot format: payload is not valid JSON");
    }
  }

  function validateJson() {
    setError("");
    try {
      JSON.parse(jsonText);
      setJsonValid(true);
      setMessage("JSON is valid");
    } catch {
      setJsonValid(false);
      setError("JSON is invalid");
    }
  }

  async function remove() {
    if (isNew) return;
    if (!confirm("Delete this work post permanently?")) return;
    try {
      await api(`/admin/work-posts/${id}`, { method: "DELETE" });
      nav("/work");
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  }

  return (
    <div>
      <div className="mb-3">
        <Link to="/work" className="small text-secondary text-decoration-none">
          ← Back to list
        </Link>
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h1 className="h3 mb-0">{isNew ? "New work post" : `Edit post #${id}`}</h1>
        <span className={`badge ${jsonValid ? "text-bg-success" : "text-bg-danger"}`}>
          JSON {jsonValid ? "valid" : "invalid"}
        </span>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="admin-card p-3 mb-3">
        <h2 className="h6 text-uppercase text-secondary mb-3">Post metadata</h2>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="video">video</option>
              <option value="photography">photography</option>
              <option value="3d">3d</option>
              <option value="ai">ai</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Legacy route id (numeric)</label>
            <input
              className="form-control"
              value={legacyId}
              onChange={(e) => setLegacyId(e.target.value)}
            />
            <div className="form-text">
              Matches <code>/work/:id</code> in the main site (per category in app logic).
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label">Sort order</label>
            <input
              type="number"
              className="form-control"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-card p-3 mb-3">
        <h2 className="h6 text-uppercase text-secondary mb-3">Content fields (non-technical)</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <Field
              label="Title"
              value={payloadForm.title}
              onChange={(v) => updatePayload((p) => ({ ...p, title: v }))}
            />
          </div>
          <div className="col-md-6">
            <Field
              label="Subtitle"
              value={payloadForm.subtitle}
              onChange={(v) => updatePayload((p) => ({ ...p, subtitle: v }))}
            />
          </div>
          <div className="col-md-6">
            <Field
              label="Vimeo URL"
              value={payloadForm.vimeoUrl}
              onChange={(v) => updatePayload((p) => ({ ...p, vimeoUrl: v }))}
              placeholder="https://vimeo.com/..."
            />
          </div>
          <div className="col-md-6">
            <Field
              label="Direct video URL (bunnyUrl)"
              value={payloadForm.bunnyUrl}
              onChange={(v) => updatePayload((p) => ({ ...p, bunnyUrl: v }))}
              placeholder="https://..."
            />
          </div>
          <div className="col-md-6">
            <Field
              label="Brand logo image URL"
              value={payloadForm.brandImage}
              onChange={(v) => updatePayload((p) => ({ ...p, brandImage: v }))}
              placeholder="/work/logos/..."
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mt-2"
              onClick={() => pickAndUpload("brandImage")}
              disabled={uploading}
            >
              Upload brand logo
            </button>
          </div>
          <div className="col-md-6">
            <Field
              label="Thumbnail image URL"
              value={payloadForm.thumbnail}
              onChange={(v) => updatePayload((p) => ({ ...p, thumbnail: v }))}
              placeholder="/work/..."
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mt-2"
              onClick={() => pickAndUpload("thumbnail")}
              disabled={uploading}
            >
              Upload thumbnail
            </button>
          </div>
          <div className="col-12">
            <TextAreaField
              label="Description"
              rows={5}
              value={payloadForm.content}
              onChange={(v) => updatePayload((p) => ({ ...p, content: v }))}
            />
          </div>
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <label className="form-label mb-0">
                Campaign stills (optional — images for “CAMPAIGN STILLS” on video posts, or gallery on image posts)
              </label>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  updatePayload((p) => ({
                    ...p,
                    campaignStills: [...(p.campaignStills || []), ""],
                  }))
                }
              >
                + Add image
              </button>
            </div>
            <p className="text-secondary small mb-2">
              Leave empty to hide that block on the site. Add URLs or upload; order matches the grid left-to-right.
            </p>
            {(payloadForm.campaignStills || []).map((url, index) => (
              <div key={index} className="border rounded p-2 mb-2">
                <Field
                  label={`Image URL ${index + 1}`}
                  value={url}
                  onChange={(v) =>
                    updatePayload((p) => {
                      const next = [...(p.campaignStills || [])];
                      next[index] = v;
                      return { ...p, campaignStills: next };
                    })
                  }
                  placeholder="/work/... or /uploads/..."
                />
                <div className="d-flex gap-2 flex-wrap mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => pickAndUploadCampaignStill(index)}
                    disabled={uploading}
                  >
                    Upload image
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() =>
                      updatePayload((p) => ({
                        ...p,
                        campaignStills: (p.campaignStills || []).filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="col-12">
            <TextAreaField
              label="Additional video URLs (one Vimeo URL per line)"
              rows={4}
              value={(payloadForm.additionalContent || []).map((item) => item.vimeoUrl).join("\n")}
              onChange={(v) =>
                updatePayload((p) => ({
                  ...p,
                  additionalContent: v
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((url) => ({ vimeoUrl: url })),
                }))
              }
              placeholder="https://vimeo.com/123456789"
            />
          </div>
        </div>
      </div>

      <div className="admin-card p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <label className="form-label mb-0">Advanced JSON (optional)</label>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={loadFieldsFromJson}
            >
              Load fields from JSON
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={validateJson}
            >
              Validate JSON
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={formatJson}
            >
              Format JSON
            </button>
          </div>
        </div>
        <textarea
          className={`form-control font-monospace small ${jsonValid ? "" : "is-invalid"}`}
          rows={16}
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setMessage("");
          }}
        />
      </div>

      <div className="d-flex gap-2 mt-3 sticky-actions">
        <button
          type="button"
          className="btn btn-accent"
          onClick={save}
          disabled={busy}
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {!isNew ? (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={remove}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
