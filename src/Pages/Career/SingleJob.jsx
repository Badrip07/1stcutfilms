import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/footer/Footer";
import GlassButton from "../../Components/GlassButton/GlassButton";
import styles from "./SingleJob.module.css";
import { useCareerPost } from "../../hooks/useCareerPosts.js";
import { usePageSections } from "../../hooks/usePageSections.js";
import { careerContentDefaults } from "./careerContentDefaults.js";
import { apiUrl } from "../../lib/apiBase.js";

const resolveAssetUrl = (url = "") => {
  if (typeof url !== "string") return url;
  if (url.startsWith("/uploads/")) return apiUrl(url);
  return url;
};

const MarqueeSection = ({ items }) => {
  const marqueeContainerRef = useRef(null);
  const firstTrackRef = useRef(null);
  const list =
    Array.isArray(items) && items.length ? items : careerContentDefaults.marquee.items;

  useEffect(() => {
    const container = marqueeContainerRef.current;
    const firstTrack = firstTrackRef.current;

    if (!container || !firstTrack) return;

    const initAnimation = () => {
      const trackWidth = firstTrack.scrollWidth;

      if (trackWidth === 0) {
        requestAnimationFrame(initAnimation);
        return;
      }

      const speed = trackWidth / 100;

      gsap.to(container, {
        x: -trackWidth,
        duration: speed,
        ease: "none",
        repeat: -1,
        force3D: true,
        immediateRender: false,
      });
    };

    const timeoutId = setTimeout(() => {
      initAnimation();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (container) {
        gsap.killTweensOf(container);
      }
    };
  }, [list]);

  return (
    <div className={styles.jobMarqueeWrapper}>
      <div className={styles.jobMarqueeContainer} ref={marqueeContainerRef}>
        <div className={styles.jobMarqueeTrack} ref={firstTrackRef}>
          <ul>
            {list.map((item, index) => (
              <li key={`original-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={styles.jobMarqueeTrack}>
          <ul>
            {list.map((item, index) => (
              <li key={`duplicate-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const SingleJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { post: job, loading, error } = useCareerPost(id);
  const { sections: pageSections } = usePageSections("career");

  const careerPage = useMemo(() => {
    const fromCms = pageSections?.career_page || {};
    return {
      hero: { ...careerContentDefaults.hero, ...(fromCms.hero || {}) },
      marquee: {
        ...careerContentDefaults.marquee,
        ...(fromCms.marquee || {}),
        items: Array.isArray(fromCms.marquee?.items)
          ? fromCms.marquee.items
          : careerContentDefaults.marquee.items,
      },
      singleJob: {
        ...careerContentDefaults.singleJob,
        ...(fromCms.singleJob || {}),
      },
      applicationForm: {
        ...careerContentDefaults.applicationForm,
        ...(fromCms.applicationForm || {}),
      },
    };
  }, [pageSections]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    resume: null,
    additionalFiles: null,
    about: "",
    agreePrivacy: false,
    agreeContact: false,
  });
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [isAdditionalFilesDragging, setIsAdditionalFilesDragging] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormClosing, setIsFormClosing] = useState(false);
  const formSectionRef = useRef(null);
  const jobContentContainerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (loading) return;
    if (job) return;
    if (error === "not_found" || error === "Invalid id") {
      navigate("/career");
    }
  }, [loading, error, job, navigate]);

  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        if (formSectionRef.current) {
          formSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFormOpen]);

  const openForm = () => {
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormClosing(true);
    setTimeout(() => {
      setIsFormOpen(false);
      setIsFormClosing(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 400);
  };

  useEffect(() => {
    if (!job) return;

    gsap.registerPlugin(ScrollTrigger);

    const elements = document.querySelectorAll('[data-animate="fade-up"]');

    const animations = Array.from(elements).map((el) =>
      gsap.fromTo(
        el,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "top 40%",
            toggleActions: "play none none reverse",
          },
        }
      )
    );

    return () => {
      animations.forEach((anim) => anim.kill());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [job]);

  useEffect(() => {
    if (!job) return;

    const section = formSectionRef.current;
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 85%",
      onEnter: () => section.classList.add(styles.formLineInView),
      onLeaveBack: () => section.classList.remove(styles.formLineInView),
    });

    return () => trigger.kill();
  }, [job]);

  useEffect(() => {
    if (!job) return;

    const container = jobContentContainerRef.current;
    if (!container) return;

    const tweens = [];

    tweens.push(
      gsap.fromTo(
        container,
        { "--job-vertical-line-scale": 0 },
        {
          "--job-vertical-line-scale": 1,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top 85%",
            end: "bottom 80%",
            scrub: true,
          },
        }
      )
    );

    tweens.push(
      gsap.fromTo(
        container,
        { "--job-header-line-scale": 0 },
        {
          "--job-header-line-scale": 1,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top 90%",
            end: "top 10%",
            scrub: true,
          },
        }
      )
    );

    return () => {
      tweens.forEach((tween) => tween.kill());
    };
  }, [job]);

  if (loading || (!job && !error)) {
    return (
      <div className={styles.singleJobPage}>
        <Navbar />
        <div className={styles.loading}>Loading...</div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className={styles.singleJobPage}>
        <Navbar />
        <div className={styles.loading}>This job is not available.</div>
        <Footer />
      </div>
    );
  }

  const heroSrc = resolveAssetUrl(
    (job.heroImage && String(job.heroImage).trim()) || careerPage.singleJob.defaultHeroImage
  );
  const heroAlt = careerPage.singleJob.defaultHeroImageAlt || "Job";

  return (
    <div className={`${styles.singleJobPage} ${isFormOpen ? styles.formOpen : ""}`}>
      <Navbar />

      <header className={styles.jobHero}>
        <div className={styles.jobHeroBackground}>
          <img src={heroSrc} alt={heroAlt} className={styles.jobHeroImage} />
          <div className={styles.jobHeroOverlay}></div>
        </div>

        <div className={styles.jobHeroContent}>
          <div className={styles.jobHeroTextInner}>
            <h1 className={styles.jobHeroTitle}>{job.title}</h1>
            <h2 className={styles.jobHeroSubtitle}>{job.subtitle}</h2>
            <GlassButton label="APPLY NOW" onClick={openForm} />
          </div>
        </div>
      </header>

      <MarqueeSection items={careerPage.marquee.items} />

      <section className={styles.jobContentSection}>
        <div className={styles.jobContentContainer} ref={jobContentContainerRef}>
          <div className={styles.jobContentLine}></div>

          <div className={styles.jobContentInner}>
            <div className={styles.jobContentBlock} data-animate="fade-up">
              <h3 className={styles.jobContentTitle}>
                <span className={styles.jobContentTitleHighlight}>ABOUT THE STUDIO</span>
              </h3>
              <p className={styles.jobContentText}>
                {job.aboutStudio ?? job.aboutFramebrains ?? ""}
              </p>
            </div>

            <div className={styles.jobContentBlock} data-animate="fade-up">
              <h3 className={styles.jobContentTitle}>
                <span className={styles.jobContentTitleHighlight}>ABOUT THE ROLE</span>
              </h3>
              <p className={styles.jobContentText}>{job.aboutRole}</p>
              <p className={styles.jobContentText}>{job.aboutRole2}</p>
            </div>

            <div className={styles.jobContentBlock} data-animate="fade-up">
              <h3 className={styles.jobContentTitle}>
                <span className={styles.jobContentTitleHighlight}>WHAT YOU'LL DO</span>
              </h3>
              {Array.isArray(job.whatYoullDo) ? (
                job.whatYoullDo.map((item, index) => (
                  <p key={index} className={styles.jobContentText}>
                    {item}
                  </p>
                ))
              ) : (
                <p className={styles.jobContentText}>{job.whatYoullDo}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${styles.applicationFormSection} ${isFormOpen ? styles.applicationFormSectionOpen : ""} ${isFormClosing ? styles.applicationFormSectionClosing : ""}`}
        ref={formSectionRef}
      >
        <div className={styles.applicationFormContainer}>
          {isFormOpen && (
            <button
              className={styles.formBackButton}
              type="button"
              onClick={closeForm}
              aria-label="Go back"
            >
              <svg
                width="800px"
                height="800px"
                viewBox="0 0 1024 1024"
                className="icon"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M903.232 256l56.768 50.432L512 768 64 306.432 120.768 256 512 659.072z"
                  fill="#000000"
                />
              </svg>
            </button>
          )}

          <div className={styles.formSectionHeader}>
            <div className={styles.formSectionHeaderLine}></div>
            <h2 className={styles.formSectionTitle}>
              <span className={styles.formSectionTitleHighlight}>
                {careerPage.applicationForm.titlePrefix}
              </span>{" "}
              {careerPage.applicationForm.titleHighlight}
            </h2>
          </div>

          <p className={styles.formSectionIntro}>{careerPage.applicationForm.intro}</p>

          <form
            className={styles.applicationForm}
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Form submitted:", formData);
            }}
          >
            <div className={styles.formSection}>
              <div className={styles.formInputGrid}>
                <div className={styles.formInputGroup}>
                  <label className={styles.formInputLabel}>FIRST NAME</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formInputGroup}>
                  <label className={styles.formInputLabel}>LAST NAME</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formInputGroup}>
                  <label className={styles.formInputLabel}>PHONE</label>
                  <input
                    type="tel"
                    className={styles.formInput}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formInputGroup}>
                  <label className={styles.formInputLabel}>EMAIL</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formUploadLabel}>Upload resume</label>
              <div className={styles.formFileUpload}>
                <input
                  type="file"
                  id="resume-upload"
                  className={styles.formFileInput}
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
                />
                <label
                  htmlFor="resume-upload"
                  className={`${styles.formFileLabel} ${isResumeDragging ? styles.formFileLabelDragging : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsResumeDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsResumeDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsResumeDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setFormData({ ...formData, resume: file });
                    }
                  }}
                >
                  <span className={styles.formFileText}>
                    Drop your file or <span className={styles.formFileLink}>upload</span>
                  </span>
                </label>
                {formData.resume && (
                  <div className={styles.formFileSelected}>{formData.resume.name}</div>
                )}
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formUploadLabel}>Additional files</label>
              <div className={styles.formFileUpload}>
                <input
                  type="file"
                  id="additional-files-upload"
                  className={styles.formFileInput}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setFormData({ ...formData, additionalFiles: e.target.files[0] })
                  }
                />
                <label
                  htmlFor="additional-files-upload"
                  className={`${styles.formFileLabel} ${isAdditionalFilesDragging ? styles.formFileLabelDragging : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsAdditionalFilesDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsAdditionalFilesDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsAdditionalFilesDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setFormData({ ...formData, additionalFiles: file });
                    }
                  }}
                >
                  <span className={styles.formFileText}>
                    Drop your file or <span className={styles.formFileLink}>upload</span>
                  </span>
                </label>
                {formData.additionalFiles && (
                  <div className={styles.formFileSelected}>{formData.additionalFiles.name}</div>
                )}
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formTextareaLabel}>COVER LETTER</label>
              <textarea
                className={styles.formTextarea}
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                rows={6}
                required
              ></textarea>
            </div>

            <div className={styles.formCheckboxSection}>
              <div className={styles.formCheckboxGroup}>
                <input
                  type="checkbox"
                  id="agree-privacy"
                  className={styles.formCheckbox}
                  checked={formData.agreePrivacy}
                  onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })}
                  required
                />
                <label htmlFor="agree-privacy" className={styles.formCheckboxLabel}>
                  By submitting this application, I agree that I have read the{" "}
                  <a
                    href="/privacy-policy"
                    className={styles.formCheckboxLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>{" "}
                  and confirm that Prites Photography stores my personal details to be able to process my
                  job application. <span className={styles.formRequired}>*</span>
                </label>
              </div>

              <div className={styles.formCheckboxGroup}>
                <input
                  type="checkbox"
                  id="agree-contact"
                  className={styles.formCheckbox}
                  checked={formData.agreeContact}
                  onChange={(e) => setFormData({ ...formData, agreeContact: e.target.checked })}
                />
                <label htmlFor="agree-contact" className={styles.formCheckboxLabel}>
                  Yes, the studio may contact me directly about specific future job opportunities.
                </label>
              </div>
            </div>

            <div className={styles.formSubmitWrapper}>
              <button type="submit" className={styles.glassBtn}>
                SUBMIT
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SingleJob;
