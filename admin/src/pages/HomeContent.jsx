import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const PAGE_SLUG = "home";
const SECTION_KEY = "home_content";
const PUBLIC_SITE_ORIGIN =
  import.meta.env.VITE_PUBLIC_SITE_ORIGIN || "http://localhost:5173";

const defaults = {
  hero: {
    backgroundVideo: "/6-home-page-banner.mp4",
    badgeImage: "/logo.png",
    titlePrefix: "WE",
    titleHighlight: "CREATE STORIES",
    titleSuffix: "AND THEY'RE F***ING GREAT",
    description: "",
    ctaLabel: "START A PROJECT",
  },
  marquee: { items: ["WE DO AI PRODUCTIONS"] },
  logos: { items: ["/logos/logo1.png"], note: "" },
  selectedWorks: {
    titlePrefix: "SELECTED",
    titleHighlight: "WORKS",
    description: "",
    moreWorkLabel: "MORE WORK",
    videos: [{ id: 1, src: "", title: "", type: "" }],
  },
  clientWords: {
    titlePrefix: "CLIENT",
    titleHighlight: "WORDS",
    description: "",
    reviews: [{ id: 1, name: "", role: "", img: "", video: "", review: "" }],
  },
  services: {
    readMoreLabel: "READ MORE",
    items: [{ id: 1, icon: "", title: "", animationType: "slideRight", description: "" }],
  },
  caseSection: {
    titlePrefix: "CLIENT",
    titleHighlight: "CASE",
    viewCaseLabel: "VIEW CASE",
    items: [{ workId: 1, titleOverride: "", descriptionOverride: "" }],
    fallbackDescription: "",
  },
  project: {
    image: "/bigcamera.png",
    imageAlt: "Professional Camera Setup",
    title: "WANT A FREE PITCH?",
    ctaLabel: "BOOK YOUR CONSULTATION",
    description1: "",
    description2: "",
  },
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaults));
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
    logos: {
      ...base.logos,
      ...(src.logos || {}),
      items: Array.isArray(src.logos?.items) ? src.logos.items : base.logos.items,
    },
    selectedWorks: {
      ...base.selectedWorks,
      ...(src.selectedWorks || {}),
      videos: Array.isArray(src.selectedWorks?.videos)
        ? src.selectedWorks.videos
        : base.selectedWorks.videos,
    },
    clientWords: {
      ...base.clientWords,
      ...(src.clientWords || {}),
      reviews: Array.isArray(src.clientWords?.reviews)
        ? src.clientWords.reviews
        : base.clientWords.reviews,
    },
    services: {
      ...base.services,
      ...(src.services || {}),
      items: Array.isArray(src.services?.items) ? src.services.items : base.services.items,
    },
    caseSection: {
      ...base.caseSection,
      ...(src.caseSection || {}),
      items: Array.isArray(src.caseSection?.items)
        ? src.caseSection.items
        : base.caseSection.items,
    },
    project: { ...base.project, ...(src.project || {}) },
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

export default function HomeContent() {
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
        if (!cancelled) setError(e.message || "Failed to load home content");
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

  async function uploadFileAndSet(targetSetter, pickOpts = {}) {
    const accept = pickOpts.accept ?? "image/*,video/*";
    try {
      setUploading(true);
      setError("");
      const files = await pickFiles({ accept, multiple: false });
      if (!files.length) return;
      const uploaded = await uploadFiles([files[0]]);
      if (uploaded[0]) targetSetter(uploaded[0]);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function uploadMultipleLogos() {
    try {
      setUploading(true);
      setError("");
      const files = await pickFiles({ accept: "image/*", multiple: true });
      if (!files.length) return;
      const uploaded = await uploadFiles(files);
      setForm((p) => ({
        ...p,
        logos: { ...p.logos, items: [...(p.logos.items || []), ...uploaded] },
      }));
    } catch (e) {
      setError(e.message || "Logo upload failed");
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
      setMessage("Home content saved successfully.");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="h3 mb-1">Home Content</h1>
      <p className="text-secondary mb-3">
        Clean editor for frontend-visible content only.
      </p>
      <div className="alert alert-info py-2">
        This page shows only fields used on the frontend. Hidden technical fields are preserved automatically.
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}
      {busy ? (
        <div className="alert alert-warning py-2" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          Updating Home content...
        </div>
      ) : null}

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Hero section</h5>
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
          label="Badge image URL"
          value={form.hero.badgeImage}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, badgeImage: v } }))}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() =>
            uploadFileAndSet((url) =>
              setForm((p) => ({ ...p, hero: { ...p.hero, badgeImage: url } }))
            )
          }
          disabled={uploading}
        >
          Upload image
        </button>
        <div className="row g-2">
          <div className="col-md-4">
            <Field
              label="Title prefix"
              value={form.hero.titlePrefix}
              onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, titlePrefix: v } }))}
            />
          </div>
          <div className="col-md-4">
            <Field
              label="Title highlight"
              value={form.hero.titleHighlight}
              onChange={(v) =>
                setForm((p) => ({ ...p, hero: { ...p.hero, titleHighlight: v } }))
              }
            />
          </div>
          <div className="col-md-4">
            <Field
              label="Title suffix"
              value={form.hero.titleSuffix}
              onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, titleSuffix: v } }))}
            />
          </div>
        </div>
        <TextAreaField
          label="Description"
          rows={4}
          value={form.hero.description}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, description: v } }))}
        />
        <Field
          label="CTA label"
          value={form.hero.ctaLabel}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, ctaLabel: v } }))}
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Marquee Section</h5>
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
        <h5 className="mb-2">Logos Section</h5>
        <div className="d-flex gap-2 mb-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={uploadMultipleLogos}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload multiple logos"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                logos: { ...p.logos, items: [...(p.logos.items || []), ""] },
              }))
            }
          >
            + Add logo URL
          </button>
        </div>

        <div className="row g-2">
          {(form.logos.items || []).map((logo, index) => (
            <div key={`${logo}-${index}`} className="col-md-6 col-xl-4">
              <div className="border rounded p-2 h-100">
                <div
                  className="d-flex align-items-center justify-content-center border rounded mb-2"
                  style={{ minHeight: "70px", background: "#0f0f0f" }}
                >
                  {logo ? (
                    <img
                      src={resolvePreviewUrl(logo)}
                      alt={`logo-${index + 1}`}
                      style={{ maxHeight: "48px", maxWidth: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <span className="text-secondary small">No logo selected</span>
                  )}
                </div>
                <input
                  className="form-control form-control-sm mb-2"
                  value={logo || ""}
                  placeholder="Logo URL"
                  onChange={(e) =>
                    setForm((p) => {
                      const next = [...(p.logos.items || [])];
                      next[index] = e.target.value;
                      return { ...p, logos: { ...p.logos, items: next } };
                    })
                  }
                />
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={index === 0}
                    onClick={() =>
                      setForm((p) => {
                        const next = [...(p.logos.items || [])];
                        const tmp = next[index - 1];
                        next[index - 1] = next[index];
                        next[index] = tmp;
                        return { ...p, logos: { ...p.logos, items: next } };
                      })
                    }
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={index >= (form.logos.items || []).length - 1}
                    onClick={() =>
                      setForm((p) => {
                        const next = [...(p.logos.items || [])];
                        const tmp = next[index + 1];
                        next[index + 1] = next[index];
                        next[index] = tmp;
                        return { ...p, logos: { ...p.logos, items: next } };
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
                        logos: {
                          ...p.logos,
                          items: (p.logos.items || []).filter((_, i) => i !== index),
                        },
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <TextAreaField
          label="Logos note text"
          rows={4}
          value={form.logos.note}
          onChange={(v) => setForm((p) => ({ ...p, logos: { ...p.logos, note: v } }))}
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Selected Works</h5>
        <div className="row g-2">
          <div className="col-md-4">
            <Field
              label="Title prefix"
              value={form.selectedWorks.titlePrefix}
              onChange={(v) =>
                setForm((p) => ({ ...p, selectedWorks: { ...p.selectedWorks, titlePrefix: v } }))
              }
            />
          </div>
          <div className="col-md-4">
            <Field
              label="Title highlight"
              value={form.selectedWorks.titleHighlight}
              onChange={(v) =>
                setForm((p) => ({ ...p, selectedWorks: { ...p.selectedWorks, titleHighlight: v } }))
              }
            />
          </div>
          <div className="col-md-4">
            <Field
              label="More work label"
              value={form.selectedWorks.moreWorkLabel}
              onChange={(v) =>
                setForm((p) => ({ ...p, selectedWorks: { ...p.selectedWorks, moreWorkLabel: v } }))
              }
            />
          </div>
        </div>
        <TextAreaField
          label="Description"
          rows={3}
          value={form.selectedWorks.description}
          onChange={(v) =>
            setForm((p) => ({ ...p, selectedWorks: { ...p.selectedWorks, description: v } }))
          }
        />
        <div className="d-flex align-items-center justify-content-between mt-2">
          <label className="form-label small mb-0">Video cards</label>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                selectedWorks: {
                  ...p.selectedWorks,
                  videos: [
                    ...(p.selectedWorks.videos || []),
                    { id: Date.now(), src: "", title: "", type: "" },
                  ],
                },
              }))
            }
          >
            + Add video card
          </button>
        </div>
        {(form.selectedWorks.videos || []).map((video, index) => (
          <div key={`${video.id}-${index}`} className="border rounded p-2 mb-2 mt-2">
            <div className="row g-2">
              <div className="col-md-6">
                <Field
                  label="Video src"
                  value={video.src}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.selectedWorks.videos || [])];
                      next[index] = { ...next[index], src: v };
                      return { ...p, selectedWorks: { ...p.selectedWorks, videos: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <Field
                  label="Title"
                  value={video.title}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.selectedWorks.videos || [])];
                      next[index] = { ...next[index], title: v };
                      return { ...p, selectedWorks: { ...p.selectedWorks, videos: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-2">
                <Field
                  label="Type"
                  value={video.type}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.selectedWorks.videos || [])];
                      next[index] = { ...next[index], type: v };
                      return { ...p, selectedWorks: { ...p.selectedWorks, videos: next } };
                    })
                  }
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  uploadFileAndSet((url) =>
                    setForm((p) => {
                      const next = [...(p.selectedWorks.videos || [])];
                      next[index] = { ...next[index], src: url };
                      return { ...p, selectedWorks: { ...p.selectedWorks, videos: next } };
                    })
                  )
                }
              >
                Upload video
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    selectedWorks: {
                      ...p.selectedWorks,
                      videos: (p.selectedWorks.videos || []).filter((_, i) => i !== index),
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
        <h5 className="mb-2">Client Words Cards</h5>
        <div className="d-flex justify-content-end mb-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                clientWords: {
                  ...p.clientWords,
                  reviews: [
                    ...(p.clientWords.reviews || []),
                    { id: Date.now(), name: "", role: "", img: "", video: "", review: "" },
                  ],
                },
              }))
            }
          >
            + Add review
          </button>
        </div>
        {(form.clientWords.reviews || []).map((review, index) => (
          <div key={`${review.id}-${index}`} className="border rounded p-2 mb-2">
            <div className="row g-2">
              <div className="col-md-4">
                <Field
                  label="Name"
                  value={review.name}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.clientWords.reviews || [])];
                      next[index] = { ...next[index], name: v };
                      return { ...p, clientWords: { ...p.clientWords, reviews: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <Field
                  label="Role"
                  value={review.role}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.clientWords.reviews || [])];
                      next[index] = { ...next[index], role: v };
                      return { ...p, clientWords: { ...p.clientWords, reviews: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-2">
                <Field
                  label="Image URL"
                  value={review.img}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.clientWords.reviews || [])];
                      next[index] = { ...next[index], img: v };
                      return { ...p, clientWords: { ...p.clientWords, reviews: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-2">
                <Field
                  label="Video URL"
                  value={review.video}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.clientWords.reviews || [])];
                      next[index] = { ...next[index], video: v };
                      return { ...p, clientWords: { ...p.clientWords, reviews: next } };
                    })
                  }
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  uploadFileAndSet((url) =>
                    setForm((p) => {
                      const next = [...(p.clientWords.reviews || [])];
                      next[index] = { ...next[index], img: url };
                      return { ...p, clientWords: { ...p.clientWords, reviews: next } };
                    })
                  )
                }
              >
                Upload image
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  uploadFileAndSet((url) =>
                    setForm((p) => {
                      const next = [...(p.clientWords.reviews || [])];
                      next[index] = { ...next[index], video: url };
                      return { ...p, clientWords: { ...p.clientWords, reviews: next } };
                    })
                  )
                }
              >
                Upload video
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    clientWords: {
                      ...p.clientWords,
                      reviews: (p.clientWords.reviews || []).filter((_, i) => i !== index),
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
        <h5 className="mb-2">Services Section</h5>
        <div className="d-flex align-items-center justify-content-between mt-2 mb-2">
          <label className="form-label small mb-0">Service cards</label>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                services: {
                  ...p.services,
                  items: [
                    ...(p.services.items || []),
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
        {(form.services.items || []).map((service, index) => (
          <div key={`${service.id}-${index}`} className="border rounded p-2 mb-2">
            <div className="row g-2">
              <div className="col-md-3">
                <Field
                  label="Icon URL"
                  value={service.icon}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.services.items || [])];
                      next[index] = { ...next[index], icon: v };
                      return { ...p, services: { ...p.services, items: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-5">
                <Field
                  label="Title"
                  value={service.title}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.services.items || [])];
                      next[index] = { ...next[index], title: v };
                      return { ...p, services: { ...p.services, items: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger w-100"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      services: {
                        ...p.services,
                        items: (p.services.items || []).filter((_, i) => i !== index),
                      },
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap mb-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  uploadFileAndSet(
                    (url) =>
                      setForm((p) => {
                        const next = [...(p.services.items || [])];
                        next[index] = { ...next[index], icon: url };
                        return { ...p, services: { ...p.services, items: next } };
                      }),
                    { accept: "image/*" }
                  )
                }
                disabled={uploading}
              >
                Upload icon image
              </button>
            </div>
            <TextAreaField
              label="Description"
              rows={2}
              value={service.description}
              onChange={(v) =>
                setForm((p) => {
                  const next = [...(p.services.items || [])];
                  next[index] = { ...next[index], description: v };
                  return { ...p, services: { ...p.services, items: next } };
                })
              }
            />
          </div>
        ))}

        <Field
          label="Services button label"
          value={form.services.readMoreLabel}
          onChange={(v) => setForm((p) => ({ ...p, services: { ...p.services, readMoreLabel: v } }))}
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Client Case Section</h5>
        <Field
          label="Case title prefix"
          value={form.caseSection.titlePrefix}
          onChange={(v) =>
            setForm((p) => ({ ...p, caseSection: { ...p.caseSection, titlePrefix: v } }))
          }
        />
        <Field
          label="Case title highlight"
          value={form.caseSection.titleHighlight}
          onChange={(v) =>
            setForm((p) => ({ ...p, caseSection: { ...p.caseSection, titleHighlight: v } }))
          }
        />
        <Field
          label="Case button label"
          value={form.caseSection.viewCaseLabel}
          onChange={(v) =>
            setForm((p) => ({ ...p, caseSection: { ...p.caseSection, viewCaseLabel: v } }))
          }
        />
        <div className="d-flex align-items-center justify-content-between mt-2 mb-2">
          <label className="form-label small mb-0">Case posts (like custom posts)</label>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                caseSection: {
                  ...p.caseSection,
                  items: [
                    ...(p.caseSection.items || []),
                    { workId: "", titleOverride: "", descriptionOverride: "" },
                  ],
                },
              }))
            }
          >
            + Add case post
          </button>
        </div>
        {(form.caseSection.items || []).map((item, index) => (
          <div key={`case-item-${index}`} className="border rounded p-2 mb-2">
            <div className="row g-2">
              <div className="col-md-3">
                <Field
                  label="Work Post ID"
                  value={item.workId}
                  placeholder="Legacy work id (e.g. 1)"
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.caseSection.items || [])];
                      next[index] = { ...next[index], workId: v };
                      return { ...p, caseSection: { ...p.caseSection, items: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <Field
                  label="Title override (optional)"
                  value={item.titleOverride}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.caseSection.items || [])];
                      next[index] = { ...next[index], titleOverride: v };
                      return { ...p, caseSection: { ...p.caseSection, items: next } };
                    })
                  }
                />
              </div>
              <div className="col-md-5">
                <TextAreaField
                  label="Description override (optional)"
                  rows={2}
                  value={item.descriptionOverride}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.caseSection.items || [])];
                      next[index] = { ...next[index], descriptionOverride: v };
                      return { ...p, caseSection: { ...p.caseSection, items: next } };
                    })
                  }
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={index === 0}
                onClick={() =>
                  setForm((p) => {
                    const next = [...(p.caseSection.items || [])];
                    const tmp = next[index - 1];
                    next[index - 1] = next[index];
                    next[index] = tmp;
                    return { ...p, caseSection: { ...p.caseSection, items: next } };
                  })
                }
              >
                Up
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={index >= (form.caseSection.items || []).length - 1}
                onClick={() =>
                  setForm((p) => {
                    const next = [...(p.caseSection.items || [])];
                    const tmp = next[index + 1];
                    next[index + 1] = next[index];
                    next[index] = tmp;
                    return { ...p, caseSection: { ...p.caseSection, items: next } };
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
                    caseSection: {
                      ...p.caseSection,
                      items: (p.caseSection.items || []).filter((_, i) => i !== index),
                    },
                  }))
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <TextAreaField
          label="Case fallback description"
          rows={3}
          value={form.caseSection.fallbackDescription}
          onChange={(v) =>
            setForm((p) => ({ ...p, caseSection: { ...p.caseSection, fallbackDescription: v } }))
          }
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Project Section</h5>
        <Field
          label="Project image URL"
          value={form.project.image}
          onChange={(v) => setForm((p) => ({ ...p, project: { ...p.project, image: v } }))}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          onClick={() =>
            uploadFileAndSet((url) => setForm((p) => ({ ...p, project: { ...p.project, image: url } })))
          }
          disabled={uploading}
        >
          Upload project image
        </button>
        <Field
          label="Project title"
          value={form.project.title}
          onChange={(v) => setForm((p) => ({ ...p, project: { ...p.project, title: v } }))}
        />
        <Field
          label="Project CTA label"
          value={form.project.ctaLabel}
          onChange={(v) => setForm((p) => ({ ...p, project: { ...p.project, ctaLabel: v } }))}
        />
        <TextAreaField
          label="Project description 1"
          rows={3}
          value={form.project.description1}
          onChange={(v) =>
            setForm((p) => ({ ...p, project: { ...p.project, description1: v } }))
          }
        />
        <TextAreaField
          label="Project description 2"
          rows={3}
          value={form.project.description2}
          onChange={(v) =>
            setForm((p) => ({ ...p, project: { ...p.project, description2: v } }))
          }
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
            "Save Home Content"
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
          Reset to defaults
        </button>
      </div>

    </div>
  );
}

