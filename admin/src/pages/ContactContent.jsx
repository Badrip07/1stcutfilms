import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { contactContentDefaults } from "../../../src/Pages/Contact/contactContentDefaults.js";

const PAGE_SLUG = "contact";
const SECTION_KEY = "contact_content";

function cloneDefaults() {
  return JSON.parse(JSON.stringify(contactContentDefaults));
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
    location: { ...base.location, ...(src.location || {}) },
    teamSection: { ...base.teamSection, ...(src.teamSection || {}) },
    startProjectSection: {
      ...base.startProjectSection,
      ...(src.startProjectSection || {}),
    },
    form: {
      ...base.form,
      ...(src.form || {}),
      sections: {
        ...base.form.sections,
        ...(src.form?.sections || {}),
        session: { ...base.form.sections.session, ...(src.form?.sections?.session || {}) },
        info: { ...base.form.sections.info, ...(src.form?.sections?.info || {}) },
        description: {
          ...base.form.sections.description,
          ...(src.form?.sections?.description || {}),
        },
      },
      labels: { ...base.form.labels, ...(src.form?.labels || {}) },
      sessionTypes:
        Array.isArray(src.form?.sessionTypes) && src.form.sessionTypes.length
          ? src.form.sessionTypes
          : base.form.sessionTypes,
      initialValues: { ...base.form.initialValues, ...(src.form?.initialValues || {}) },
    },
    teamMembers: Array.isArray(src.teamMembers) ? src.teamMembers : base.teamMembers,
  };
}

function Field({ label, value, onChange }) {
  return (
    <div className="mb-2">
      <label className="form-label small mb-1">{label}</label>
      <input className="form-control" value={value || ""} onChange={(e) => onChange(e.target.value)} />
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

export default function ContactContent() {
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
        if (!cancelled) setError(e.message || "Failed to load contact content");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function pickFiles({ accept = "*/*" } = {}) {
    return new Promise((resolve) => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.accept = accept;
      picker.multiple = false;
      picker.onchange = () => resolve(Array.from(picker.files || []));
      picker.click();
    });
  }

  async function uploadFileAndSet(targetSetter) {
    try {
      setUploading(true);
      setError("");
      const files = await pickFiles({ accept: "image/*,video/*" });
      if (!files.length) return;
      const fd = new FormData();
      fd.append("file", files[0]);
      const res = await api("/admin/media", { method: "POST", body: fd });
      if (res?.url) targetSetter(res.url);
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
      setMessage("Contact content saved successfully.");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="h3 mb-1">Contact content</h1>
      <p className="text-secondary mb-3">Edit text and images used on the frontend Contact page.</p>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Hero</h5>
        <Field
          label="Hero title"
          value={form.hero.title}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, title: v } }))}
        />
        <Field
          label="Hero CTA label"
          value={form.hero.ctaLabel}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, ctaLabel: v } }))}
        />
        <Field
          label="Hero banner image URL"
          value={form.hero.bannerImage}
          onChange={(v) => setForm((p) => ({ ...p, hero: { ...p.hero, bannerImage: v } }))}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-2"
          disabled={uploading}
          onClick={() =>
            uploadFileAndSet((url) => setForm((p) => ({ ...p, hero: { ...p.hero, bannerImage: url } })))
          }
        >
          Upload hero image
        </button>
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Marquee + Location</h5>
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
        <Field
          label="Location title"
          value={form.location.title}
          onChange={(v) => setForm((p) => ({ ...p, location: { ...p.location, title: v } }))}
        />
        <Field
          label="Address"
          value={form.location.address}
          onChange={(v) => setForm((p) => ({ ...p, location: { ...p.location, address: v } }))}
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Team section</h5>
        <Field
          label="Team title"
          value={form.teamSection.title}
          onChange={(v) => setForm((p) => ({ ...p, teamSection: { ...p.teamSection, title: v } }))}
        />
        <Field
          label="Team title highlight"
          value={form.teamSection.highlight}
          onChange={(v) => setForm((p) => ({ ...p, teamSection: { ...p.teamSection, highlight: v } }))}
        />
        <TextAreaField
          label="Team description"
          rows={4}
          value={form.teamSection.description}
          onChange={(v) => setForm((p) => ({ ...p, teamSection: { ...p.teamSection, description: v } }))}
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Team members</h5>
        <div className="d-flex justify-content-end mb-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setForm((p) => ({
                ...p,
                teamMembers: [
                  ...(p.teamMembers || []),
                  {
                    id: Date.now(),
                    name: "",
                    title: "",
                    image: "",
                    email: "",
                    phone: "",
                  },
                ],
              }))
            }
          >
            + Add team member
          </button>
        </div>
        {(form.teamMembers || []).map((member, index) => (
          <div key={`${member.id}-${index}`} className="border rounded p-2 mb-2">
            <div className="row g-2">
              <div className="col-md-4">
                <Field
                  label="Name"
                  value={member.name}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.teamMembers || [])];
                      next[index] = { ...next[index], name: v };
                      return { ...p, teamMembers: next };
                    })
                  }
                />
              </div>
              <div className="col-md-3">
                <Field
                  label="Title"
                  value={member.title}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.teamMembers || [])];
                      next[index] = { ...next[index], title: v };
                      return { ...p, teamMembers: next };
                    })
                  }
                />
              </div>
              <div className="col-md-5">
                <Field
                  label="Image URL"
                  value={member.image}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.teamMembers || [])];
                      next[index] = { ...next[index], image: v };
                      return { ...p, teamMembers: next };
                    })
                  }
                />
              </div>
            </div>
            <div className="row g-2">
              <div className="col-md-6">
                <Field
                  label="Email"
                  value={member.email}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.teamMembers || [])];
                      next[index] = { ...next[index], email: v };
                      return { ...p, teamMembers: next };
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <Field
                  label="Phone"
                  value={member.phone}
                  onChange={(v) =>
                    setForm((p) => {
                      const next = [...(p.teamMembers || [])];
                      next[index] = { ...next[index], phone: v };
                      return { ...p, teamMembers: next };
                    })
                  }
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger w-100"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      teamMembers: (p.teamMembers || []).filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mt-2"
              disabled={uploading}
              onClick={() =>
                uploadFileAndSet((url) =>
                  setForm((p) => {
                    const next = [...(p.teamMembers || [])];
                    next[index] = { ...next[index], image: url };
                    return { ...p, teamMembers: next };
                  })
                )
              }
            >
              Upload member image
            </button>
          </div>
        ))}
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Start project form (session type)</h5>
        <Field
          label="Session question — full title"
          value={form.form.sections.session.title}
          onChange={(v) =>
            setForm((p) => ({
              ...p,
              form: {
                ...p.form,
                sections: {
                  ...p.form.sections,
                  session: { ...p.form.sections.session, title: v },
                },
              },
            }))
          }
        />
        <Field
          label="Session question — highlight phrase (must appear inside full title)"
          value={form.form.sections.session.highlight}
          onChange={(v) =>
            setForm((p) => ({
              ...p,
              form: {
                ...p.form,
                sections: {
                  ...p.form.sections,
                  session: { ...p.form.sections.session, highlight: v },
                },
              },
            }))
          }
        />
        <TextAreaField
          label="Session type options (one per line)"
          rows={4}
          value={(form.form.sessionTypes || []).join("\n")}
          onChange={(v) =>
            setForm((p) => ({
              ...p,
              form: {
                ...p.form,
                sessionTypes: v.split("\n").map((s) => s.trim()).filter(Boolean),
              },
            }))
          }
        />
      </div>

      <div className="admin-card p-3 mb-3">
        <h5 className="mb-2">Start project section</h5>
        <Field
          label="Start title"
          value={form.startProjectSection.title}
          onChange={(v) =>
            setForm((p) => ({ ...p, startProjectSection: { ...p.startProjectSection, title: v } }))
          }
        />
        <Field
          label="Start title highlight"
          value={form.startProjectSection.highlight}
          onChange={(v) =>
            setForm((p) => ({ ...p, startProjectSection: { ...p.startProjectSection, highlight: v } }))
          }
        />
        <TextAreaField
          label="Start project description"
          rows={4}
          value={form.startProjectSection.description}
          onChange={(v) =>
            setForm((p) => ({ ...p, startProjectSection: { ...p.startProjectSection, description: v } }))
          }
        />
      </div>

      <div className="d-flex gap-2 mt-3 sticky-actions">
        <button type="button" className="btn btn-accent" onClick={save} disabled={busy}>
          {busy ? "Saving..." : "Save Contact content"}
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
