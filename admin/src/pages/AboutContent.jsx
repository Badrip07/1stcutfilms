import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { aboutContentDefaults } from "../../../src/Pages/About/aboutContentDefaults.js";

const PAGE_SLUG = "about";
const SECTION_KEY = "about_content";
const PUBLIC_SITE_ORIGIN =
  import.meta.env.VITE_PUBLIC_SITE_ORIGIN || "http://localhost:5173";

function cloneDefaults() {
  return JSON.parse(JSON.stringify(aboutContentDefaults));
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
    timeline: {
      ...base.timeline,
      ...(src.timeline || {}),
      items: Array.isArray(src.timeline?.items) ? src.timeline.items : base.timeline.items,
    },
    gallery: {
      ...base.gallery,
      ...(src.gallery || {}),
      items: Array.isArray(src.gallery?.items) ? src.gallery.items : base.gallery.items,
    },
    servicesSection: {
      ...base.servicesSection,
      ...(src.servicesSection || {}),
      items: Array.isArray(src.servicesSection?.items)
        ? src.servicesSection.items
        : base.servicesSection.items,
    },
    family: { ...base.family, ...(src.family || {}) },
  };
}

function resolvePreviewUrl(url = "") {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return url;
  if (url.startsWith("/")) return `${PUBLIC_SITE_ORIGIN}${url}`;
  return url;
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

export default function AboutContent() {
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
        if (!cancelled) setError(e.message || "Failed to load about content");
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
      picker.onchange = () => {
        resolve(Array.from(picker.files || []));
      };
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
      setMessage("About content saved successfully.");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="h3 mb-1">About page content</h1>
      <p className="text-secondary mb-3">
        Same flow as home: text, images, and video URLs are stored in the CMS and shown on the public About page.
      </p>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}
      {busy ? (
        <div className="alert alert-warning py-2" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Saving About content...
        </div>
      ) : null}

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Hero</h5>
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
          label="Title"
          value={form.hero.title}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, title: v } }))}
        />
        <Field
          label="Subtitle"
          value={form.hero.subtitle}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, subtitle: v } }))}
        />
        <TextAreaField
          label="Description"
          rows={5}
          value={form.hero.description}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, description: v } }))}
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Marquee</h5>
        <TextAreaField
          label="Marquee items (one per line)"
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
        <h5 className="mb-2">Timeline</h5>
        <div className="d-flex justify-content-end mb-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                timeline: {
                  ...p.timeline,
                  items: [...(p.timeline.items || []), { title: "", text: "" }],
                },
              }))
            }
          >
            + Add timeline entry
          </button>
        </div>
        {(form.timeline.items || []).map((entry, index) => (
          <div key={`tl-${index}`} className="border rounded p-2 mb-2">
            <Field
              label="Title"
              value={entry.title}
              onChange={(v) =>
                setForm((p) => {
                  const next = [...(p.timeline.items || [])];
                  next[index] = { ...next[index], title: v };
                  return { ...p, timeline: { ...p.timeline, items: next } };
                })
              }
            />
            <TextAreaField
              label="Text"
              rows={3}
              value={entry.text}
              onChange={(v) =>
                setForm((p) => {
                  const next = [...(p.timeline.items || [])];
                  next[index] = { ...next[index], text: v };
                  return { ...p, timeline: { ...p.timeline, items: next } };
                })
              }
            />
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={index === 0}
                onClick={() =>
                  setForm((p) => {
                    const next = [...(p.timeline.items || [])];
                    const tmp = next[index - 1];
                    next[index - 1] = next[index];
                    next[index] = tmp;
                    return { ...p, timeline: { ...p.timeline, items: next } };
                  })
                }
              >
                Up
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={index >= (form.timeline.items || []).length - 1}
                onClick={() =>
                  setForm((p) => {
                    const next = [...(p.timeline.items || [])];
                    const tmp = next[index + 1];
                    next[index + 1] = next[index];
                    next[index] = tmp;
                    return { ...p, timeline: { ...p.timeline, items: next } };
                  })
                }
              >
                Down
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-auto"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    timeline: {
                      ...p.timeline,
                      items: (p.timeline.items || []).filter((_, i) => i !== index),
                    },
                  }))
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Gallery (About images)</h5>
        <div className="d-flex justify-content-end mb-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                gallery: {
                  ...p.gallery,
                  items: [
                    ...(p.gallery.items || []),
                    { src: "", alt: "", variant: "default" },
                  ],
                },
              }))
            }
          >
            + Add image
          </button>
        </div>
        {(form.gallery.items || []).map((img, index) => (
          <div key={`g-${index}`} className="border rounded p-2 mb-2">
            <div
              className="d-flex align-items-center justify-content-center border rounded mb-2"
              style={{ minHeight: "80px", background: "#0f0f0f" }}
            >
              {img.src ? (
                <img
                  src={resolvePreviewUrl(img.src)}
                  alt={img.alt || ""}
                  style={{ maxHeight: "72px", maxWidth: "100%", objectFit: "contain" }}
                />
              ) : (
                <span className="text-secondary small">No image</span>
              )}
            </div>
            <Field
              label="Image URL"
              value={img.src}
              onChange={(v) =>
                setForm((p) => {
                  const next = [...(p.gallery.items || [])];
                  next[index] = { ...next[index], src: v };
                  return { ...p, gallery: { ...p.gallery, items: next } };
                })
              }
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mb-2"
              onClick={() =>
                uploadFileAndSet((url) =>
                  setForm((p) => {
                    const next = [...(p.gallery.items || [])];
                    next[index] = { ...next[index], src: url };
                    return { ...p, gallery: { ...p.gallery, items: next } };
                  })
                )
              }
              disabled={uploading}
            >
              Upload image
            </button>
            <Field
              label="Alt text"
              value={img.alt}
              onChange={(v) =>
                setForm((p) => {
                  const next = [...(p.gallery.items || [])];
                  next[index] = { ...next[index], alt: v };
                  return { ...p, gallery: { ...p.gallery, items: next } };
                })
              }
            />
            <div className="mb-2">
              <label className="form-label small mb-1">Layout width</label>
              <select
                className="form-select form-select-sm"
                value={img.variant === "wide" ? "wide" : "default"}
                onChange={(e) =>
                  setForm((p) => {
                    const next = [...(p.gallery.items || [])];
                    next[index] = { ...next[index], variant: e.target.value };
                    return { ...p, gallery: { ...p.gallery, items: next } };
                  })
                }
              >
                <option value="default">Standard</option>
                <option value="wide">Wide (full-width tile)</option>
              </select>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={index === 0}
                onClick={() =>
                  setForm((p) => {
                    const next = [...(p.gallery.items || [])];
                    const tmp = next[index - 1];
                    next[index - 1] = next[index];
                    next[index] = tmp;
                    return { ...p, gallery: { ...p.gallery, items: next } };
                  })
                }
              >
                Up
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={index >= (form.gallery.items || []).length - 1}
                onClick={() =>
                  setForm((p) => {
                    const next = [...(p.gallery.items || [])];
                    const tmp = next[index + 1];
                    next[index + 1] = next[index];
                    next[index] = tmp;
                    return { ...p, gallery: { ...p.gallery, items: next } };
                  })
                }
              >
                Down
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-auto"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    gallery: {
                      ...p.gallery,
                      items: (p.gallery.items || []).filter((_, i) => i !== index),
                    },
                  }))
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Services block</h5>
        <div className="row g-2">
          <div className="col-md-6">
            <Field
              label="Title (before highlight)"
              value={form.servicesSection.titlePrefix}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  servicesSection: { ...p.servicesSection, titlePrefix: v },
                }))
              }
            />
          </div>
          <div className="col-md-6">
            <Field
              label="Title highlight"
              value={form.servicesSection.titleHighlight}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  servicesSection: { ...p.servicesSection, titleHighlight: v },
                }))
              }
            />
          </div>
        </div>
        <TextAreaField
          label="Intro paragraph 1"
          rows={3}
          value={form.servicesSection.description1}
          onChange={(v) =>
            setForm((p) => ({
              ...p,
              servicesSection: { ...p.servicesSection, description1: v },
            }))
          }
        />
        <TextAreaField
          label="Intro paragraph 2"
          rows={3}
          value={form.servicesSection.description2}
          onChange={(v) =>
            setForm((p) => ({
              ...p,
              servicesSection: { ...p.servicesSection, description2: v },
            }))
          }
        />
        <div className="d-flex align-items-center justify-content-between mt-2 mb-2">
          <label className="form-label small mb-0">Service cards</label>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                servicesSection: {
                  ...p.servicesSection,
                  items: [
                    ...(p.servicesSection.items || []),
                    {
                      id: Date.now(),
                      icon: "",
                      title: "",
                      animationType: "slideRight",
                      description: "",
                    },
                  ],
                },
              }))
            }
          >
            + Add service
          </button>
        </div>
        {(form.servicesSection.items || []).map((service, index) => (
          <div key={`${service.id}-${index}`} className="border rounded p-2 mb-2">
            <div className="row g-2">
              <div className="col-md-4">
                <Field
                  label="Icon URL"
                  value={service.icon}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.servicesSection.items || [])];
                      next[index] = { ...next[index], icon: v };
                      return { ...p, servicesSection: { ...p.servicesSection, items: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <Field
                  label="Title"
                  value={service.title}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.servicesSection.items || [])];
                      next[index] = { ...next[index], title: v };
                      return { ...p, servicesSection: { ...p.servicesSection, items: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small mb-1">Animation</label>
                <select
                  className="form-select form-select-sm"
                  value={service.animationType || "slideRight"}
                  onChange={(e) =>
                    setForm((p) => {
                      const next = [...(p.servicesSection.items || [])];
                      next[index] = { ...next[index], animationType: e.target.value };
                      return { ...p, servicesSection: { ...p.servicesSection, items: next } };
                    })
                  }
                >
                  <option value="slideRight">slideRight</option>
                  <option value="slideUp">slideUp</option>
                  <option value="rotate3d">rotate3d</option>
                </select>
              </div>
            </div>
            <TextAreaField
              label="Description"
              rows={4}
              value={service.description}
              onChange={(v) =>
                setForm((p) => {
                  const next = [...(p.servicesSection.items || [])];
                  next[index] = { ...next[index], description: v };
                  return { ...p, servicesSection: { ...p.servicesSection, items: next } };
                })
              }
            />
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  uploadFileAndSet((url) =>
                    setForm((p) => {
                      const next = [...(p.servicesSection.items || [])];
                      next[index] = { ...next[index], icon: url };
                      return { ...p, servicesSection: { ...p.servicesSection, items: next } };
                    })
                  )
                }
              >
                Upload icon (gif/image)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    servicesSection: {
                      ...p.servicesSection,
                      items: (p.servicesSection.items || []).filter((_, i) => i !== index),
                    },
                  }))
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Team section</h5>
        <Field
          label="Image URL"
          value={form.family.image}
          onChange={(v) => setForm((p) => ({ ...p, family: { ...p.family, image: v } }))}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() =>
            uploadFileAndSet((url) => setForm((p) => ({ ...p, family: { ...p.family, image: url } })))
          }
          disabled={uploading}
        >
          Upload image
        </button>
        <Field
          label="Image alt text"
          value={form.family.imageAlt}
          onChange={(v) => setForm((p) => ({ ...p, family: { ...p.family, imageAlt: v } }))}
        />
        <Field
          label="Section title"
          value={form.family.title}
          onChange={(v) => setForm((p) => ({ ...p, family: { ...p.family, title: v } }))}
        />
        <TextAreaField
          label="Paragraph 1"
          rows={3}
          value={form.family.description1}
          onChange={(v) => setForm((p) => ({ ...p, family: { ...p.family, description1: v } }))}
        />
        <TextAreaField
          label="Paragraph 2"
          rows={3}
          value={form.family.description2}
          onChange={(v) => setForm((p) => ({ ...p, family: { ...p.family, description2: v } }))}
        />
      </div>

      <div className="d-flex gap-2 mt-3 sticky-actions">
        <button type="button" className="btn btn-accent" onClick={save} disabled={busy}>
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            "Save About content"
          )}
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
          Reset to file defaults
        </button>
      </div>
    </div>
  );
}
