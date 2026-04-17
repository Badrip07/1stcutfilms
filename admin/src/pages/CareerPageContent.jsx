import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { careerContentDefaults } from "../../../src/Pages/Career/careerContentDefaults.js";

const PAGE_SLUG = "career";
const SECTION_KEY = "career_page";

function cloneDefaults() {
  return JSON.parse(JSON.stringify(careerContentDefaults));
}

function mergeWithDefaults(incoming) {
  const base = cloneDefaults();
  const src = incoming || {};
  return {
    ...base,
    ...src,
    hero: { ...base.hero, ...(src.hero || {}) },
    marquee: {
      ...base.marquee,
      ...(src.marquee || {}),
      items: Array.isArray(src.marquee?.items) ? src.marquee.items : base.marquee.items,
    },
    openPositions: { ...base.openPositions, ...(src.openPositions || {}) },
    singleJob: { ...base.singleJob, ...(src.singleJob || {}) },
    applicationForm: { ...base.applicationForm, ...(src.applicationForm || {}) },
  };
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-2">
      <label className="form-label small mb-1">{label}</label>
      <input
        className="form-control"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
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

export default function CareerPageContent() {
  const [form, setForm] = useState(() => cloneDefaults());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await api(`/admin/page-sections/${PAGE_SLUG}`);
        if (cancelled) return;
        const row = rows.find((r) => r.section_key === SECTION_KEY);
        setForm(mergeWithDefaults(row?.payload));
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load career page content");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function pickFiles({ accept = "*/*", multiple = false } = {}) {
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

  async function uploadFileAndSet(targetSetter) {
    try {
      setUploading(true);
      setError("");
      const files = await pickFiles({ accept: "image/*,video/*", multiple: false });
      if (!files.length) return;
      const uploaded = await uploadFiles([files[0]]);
      if (uploaded[0]) targetSetter(uploaded[0]);
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
    try {
      await api(`/admin/page-sections/${PAGE_SLUG}/${SECTION_KEY}`, {
        method: "PUT",
        body: JSON.stringify({ payload: form }),
      });
      setMessage("Career page content saved.");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="h3 mb-1">Career page (layout)</h1>
      <p className="text-secondary mb-3">
        Hero, marquee, section headings, default job hero image, and application block copy shared by all job posts.
      </p>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Career listing hero</h5>
        <Field
          label="Background video URL"
          value={form.hero.backgroundVideo}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, backgroundVideo: v } }))}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() =>
            uploadFileAndSet((url) =>
              setForm((p) => ({ ...p, hero: { ...p.hero, backgroundVideo: url } }))
            )
          }
          disabled={uploading}
        >
          Upload video
        </button>
        <Field
          label="Hero title"
          value={form.hero.title}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, title: v } }))}
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Marquee</h5>
        <TextAreaField
          label="Items (one per line)"
          rows={4}
          value={(form.marquee.items || []).join("\n")}
          onChange={(v) =>
            setForm((p) => ({
              ...p,
              marquee: { ...p.marquee, items: v.split("\n").map((s) => s.trim()).filter(Boolean) },
            }))
          }
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Open positions heading</h5>
        <div className="row g-2">
          <div className="col-md-6">
            <Field
              label="Highlighted word (e.g. OPEN)"
              value={form.openPositions.titlePrefix}
              onChange={(v) =>
                setForm((p) => ({ ...p, openPositions: { ...p.openPositions, titlePrefix: v } }))
              }
            />
          </div>
          <div className="col-md-6">
            <Field
              label="Rest of title (e.g. POSITIONS)"
              value={form.openPositions.titleHighlight}
              onChange={(v) =>
                setForm((p) => ({ ...p, openPositions: { ...p.openPositions, titleHighlight: v } }))
              }
            />
          </div>
        </div>
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Single job page defaults</h5>
        <p className="small text-secondary">
          Used when a job has no per-job hero image. Marquee on the job page uses the same list as above.
        </p>
        <Field
          label="Default hero image URL"
          value={form.singleJob.defaultHeroImage}
          onChange={(v) =>
            setForm((p) => ({ ...p, singleJob: { ...p.singleJob, defaultHeroImage: v } }))
          }
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() =>
            uploadFileAndSet((url) =>
              setForm((p) => ({ ...p, singleJob: { ...p.singleJob, defaultHeroImage: url } }))
            )
          }
          disabled={uploading}
        >
          Upload image
        </button>
        <Field
          label="Default hero image alt"
          value={form.singleJob.defaultHeroImageAlt}
          onChange={(v) =>
            setForm((p) => ({ ...p, singleJob: { ...p.singleJob, defaultHeroImageAlt: v } }))
          }
        />
      </div>

      <div className="d-flex gap-2 mt-3 sticky-actions">
        <button type="button" className="btn btn-accent" onClick={save} disabled={busy}>
          {busy ? "Saving..." : "Save career page"}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => {
            setForm(cloneDefaults());
            setMessage("");
            setError("");
          }}
          disabled={busy}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
