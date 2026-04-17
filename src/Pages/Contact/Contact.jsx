import React, { useRef, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Contact.module.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/footer/Footer";
import GlassButton from "../../Components/GlassButton/GlassButton";
import { usePageSections } from "../../hooks/usePageSections.js";
import { contactContentDefaults } from "./contactContentDefaults.js";

/* ✅ CONTACT FORM COMPONENT */
const ContactForm = ({ content }) => {
  const [formData, setFormData] = useState(content.form.initialValues);
  const services = content.form.services;

  useEffect(() => {
    setFormData(content.form.initialValues);
  }, [content.form.initialValues]);

  const handleServiceChange = (service) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your form submission logic here
  };

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit}>
      {/* WHAT DO YOU NEED HELP WITH? */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          {content.form.sections.services.title.replace(
            content.form.sections.services.highlight,
            ""
          )}{" "}
          <span className={styles.formSectionTitleHighlight}>
            {content.form.sections.services.highlight}
          </span>
        </h3>
        <div className={styles.servicesGrid}>
          {services.map((service) => (
            <label key={service} className={styles.serviceCheckbox}>
              <input
                type="checkbox"
                checked={formData.services.includes(service)}
                onChange={() => handleServiceChange(service)}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxLabel}>{service}</span>
            </label>
          ))}
        </div>
      </div>

      {/* YOUR INFORMATION */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          {content.form.sections.info.title.replace(
            content.form.sections.info.highlight,
            ""
          )}{" "}
          <span className={styles.formSectionTitleHighlight}>
            {content.form.sections.info.highlight}
          </span>
        </h3>
        <div className={styles.inputGroup}>
          <div className={styles.inputFieldWrapper}>
            <label className={styles.inputLabel}>{content.form.labels.name}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.formInput}
              required
            />
          </div>
          <div className={styles.inputFieldWrapper}>
            <label className={styles.inputLabel}>{content.form.labels.email}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.formInput}
              required
            />
          </div>
          <div className={styles.inputFieldWrapper}>
            <label className={styles.inputLabel}>{content.form.labels.phone}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={styles.formInput}
              required
            />
          </div>
        </div>
      </div>

      {/* DESCRIBE WHAT YOU WANT */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          {content.form.sections.description.title.replace(
            content.form.sections.description.highlight,
            ""
          )}{" "}
          <span className={styles.formSectionTitleHighlight}>
            {content.form.sections.description.highlight}
          </span>
        </h3>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder=""
          className={styles.formTextarea}
          rows={6}
        />
      </div>

      {/* SUBMIT BUTTON */}
      <div className={styles.formSubmitWrapper}>
        <button type="submit" className={styles.glassBtn}>
          <span>{content.form.labels.submit}</span>
        </button>
      </div>
    </form>
  );
};
 
const Contact = () => {
  const location = useLocation();
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isStartClosing, setIsStartClosing] = useState(false);
  const [hasAutoOpenedFromHome, setHasAutoOpenedFromHome] = useState(false);
  const contactTeamSectionRef = useRef(null);
  const contactProjectSectionRef = useRef(null);
  const { sections: pageSections } = usePageSections("contact");

  const contactContent = useMemo(() => {
    const fromCms = pageSections?.contact_content || {};
    return {
      hero: { ...contactContentDefaults.hero, ...(fromCms.hero || {}) },
      marquee: {
        ...contactContentDefaults.marquee,
        ...(fromCms.marquee || {}),
        items: Array.isArray(fromCms.marquee?.items)
          ? fromCms.marquee.items
          : contactContentDefaults.marquee.items,
      },
      location: { ...contactContentDefaults.location, ...(fromCms.location || {}) },
      teamSection: { ...contactContentDefaults.teamSection, ...(fromCms.teamSection || {}) },
      startProjectSection: {
        ...contactContentDefaults.startProjectSection,
        ...(fromCms.startProjectSection || {}),
      },
      form: {
        ...contactContentDefaults.form,
        ...(fromCms.form || {}),
        sections: {
          ...contactContentDefaults.form.sections,
          ...(fromCms.form?.sections || {}),
          services: {
            ...contactContentDefaults.form.sections.services,
            ...(fromCms.form?.sections?.services || {}),
          },
          info: {
            ...contactContentDefaults.form.sections.info,
            ...(fromCms.form?.sections?.info || {}),
          },
          description: {
            ...contactContentDefaults.form.sections.description,
            ...(fromCms.form?.sections?.description || {}),
          },
        },
        labels: {
          ...contactContentDefaults.form.labels,
          ...(fromCms.form?.labels || {}),
        },
        services: Array.isArray(fromCms.form?.services)
          ? fromCms.form.services
          : contactContentDefaults.form.services,
        initialValues: {
          ...contactContentDefaults.form.initialValues,
          ...(fromCms.form?.initialValues || {}),
        },
      },
      teamMembers: Array.isArray(fromCms.teamMembers)
        ? fromCms.teamMembers
        : contactContentDefaults.teamMembers,
    };
  }, [pageSections]);

  const openStartProject = () => {
    setIsStartOpen(true);
    setIsStartClosing(false);
  };

  const closeStartProject = () => {
    setIsStartClosing(true);
    setTimeout(() => {
      setIsStartOpen(false);
      setIsStartClosing(false);
    }, 400);
  };

  // Lock / unlock body scroll when Start Project form is open
  useEffect(() => {
    if (isStartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isStartOpen]);

  // If we navigated here from "START A PROJECT" or "BOOK YOUR CONSULTATION",
  // scroll to top of Contact page first, then open the Start Project form once.
  useEffect(() => {
    if (
      location.state &&
      location.state.openStartProjectFromHome &&
      !isStartOpen &&
      !hasAutoOpenedFromHome
    ) {
      // Scroll to top of contact page first so user sees the top, then open form
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      const timer = setTimeout(() => {
        setIsStartOpen(true);
        setIsStartClosing(false);
        setHasAutoOpenedFromHome(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.state, isStartOpen, hasAutoOpenedFromHome]);
  // 3D depth + shadow effect for hero3d-style buttons (same as home page banner button)
  useEffect(() => {
    const buttons = document.querySelectorAll(`.${styles.hero3dBtn}`);
    if (!buttons.length) return;

    const listeners = [];

    buttons.forEach((btn) => {
      const span = btn.querySelector("span");
      if (!span) return;

      const handleMouseMove = (e) => {
        const rect = btn.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Normalize cursor position to -1 to 1 range
        const percentX = (x - centerX) / centerX;
        const percentY = (y - centerY) / centerY;

        // opposite direction for shadow and movement
        const moveX = (centerX - x) / 20;
        const moveY = (centerY - y) / 20;

        // dynamic shadow grows opposite
        span.style.boxShadow = `${moveX}px ${moveY}px 0px 8px rgb(190 190 190)`;

        // Dynamic gradient: moves opposite to cursor
        // When cursor moves right, gradient shifts left (more dark on right, more light on left)
        // When cursor moves left, gradient shifts right (more light on right, more dark on left)
        const gradientAngle = 135 + percentX * 45; // 90-180 degrees
        const lightPosition = Math.max(0, Math.min(100, 50 - percentX * 30)); // moves 20-80% opposite

        span.style.backgroundImage = `linear-gradient(
          ${gradientAngle}deg,
          rgb(255 255 255) 0%,
          rgb(145 145 145 / 95%) ${lightPosition}%,
          rgb(41 41 41 / 95%) 100%
        )`;

        span.style.transform = `
          translateZ(20px)
          rotateX(${-(y - centerY) / 6}deg)
          rotateY(${(x - centerX) / 6}deg)
        `;
      };

      const handleMouseLeave = () => {
        span.style.transform = "translateZ(0) rotateX(0) rotateY(0)";
        span.style.boxShadow = "none";
        span.style.backgroundImage = "";
      };

      btn.addEventListener("mousemove", handleMouseMove);
      btn.addEventListener("mouseleave", handleMouseLeave);

      listeners.push({ btn, handleMouseMove, handleMouseLeave, span });
    });

    return () => {
      listeners.forEach(({ btn, handleMouseMove, handleMouseLeave, span }) => {
        btn.removeEventListener("mousemove", handleMouseMove);
        btn.removeEventListener("mouseleave", handleMouseLeave);
        if (span) {
          span.style.transform = "translateZ(0) rotateX(0) rotateY(0)";
          span.style.boxShadow = "none";
          span.style.backgroundImage = "";
        }
      });
    };
  }, []);

  // Heading line draw on scroll: MEET THE TEAM, START A PROJECT
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const teamSection = contactTeamSectionRef.current;
    const projectSection = contactProjectSectionRef.current;

    const triggers = [];
    if (teamSection) {
      triggers.push(
        ScrollTrigger.create({
          trigger: teamSection,
          start: "top 75%",
          onEnter: () => teamSection.classList.add(styles.contactTeamLineInView),
          onLeaveBack: () => teamSection.classList.remove(styles.contactTeamLineInView),
        })
      );
    }
    if (projectSection) {
      triggers.push(
        ScrollTrigger.create({
          trigger: projectSection,
          start: "top 75%",
          onEnter: () => projectSection.classList.add(styles.contactProjectLineInView),
          onLeaveBack: () => projectSection.classList.remove(styles.contactProjectLineInView),
        })
      );
    }

    return () => triggers.forEach((t) => t.kill());
  }, []);

  // When arriving with #work in URL (e.g. /contact#work), scroll to that section
  useEffect(() => {
    if (location.hash === "#work") {
      const target = document.getElementById("work");
      if (target) {
        // Small delay to ensure layout & ScrollTrigger are ready
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          // Ensure it's visible even if fade-up hasn't triggered
          gsap.to(target, {
            opacity: 1,
            y: 0,
            duration: 0,
            clearProps: "opacity,transform",
          });
        }, 150);
      }
    }
  }, [location]);

  // Scroll-triggered fade-in-up animation for sections
  useEffect(() => {
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
  }, []);

  const teamMembers = contactContent.teamMembers;

  const videoWorks = [
    {
      id: 1,
      src: "/video1.mp4",
      title: "SUSHI YAMA",
      type: "CREATIVE BRANDFILM",
    },
    {
      id: 2,
      src: "/video2.mp4",
      title: "FASHION STORY",
      type: "PRODUCT SHOWCASE",
    },
    {
      id: 3,
      src: "/video3.mp4",
      title: "URBAN VIBES",
      type: "COMMERCIAL FILM",
    },
    { id: 4, src: "/video4.mp4", title: "TECH REVEAL", type: "3D ANIMATION" },
    { id: 5, src: "/video5.mp4", title: "LIFESTYLE", type: "BRAND STORY" },
    { id: 6, src: "/video6.mp4", title: "ABSTRACT", type: "MOTION DESIGN" },
    { id: 7, src: "/video1.mp4", title: "CREATIVE", type: "FILM PRODUCTION" },
  ];

  // Popup player state for Selected Works videos
  const [activeVideo, setActiveVideo] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleVideoClick = (video) => {
    if (!video) {
      console.log("handleVideoClick called with no video");
      return;
    }
    console.log("Video clicked:", video);
    console.log("Setting activeVideo and opening modal");
    setActiveVideo(video);
    setIsVideoModalOpen(true);
    console.log("State should be updated now");
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setTimeout(() => {
      setActiveVideo(null);
    }, 200);
  };

  return (
    <>
      <div className={styles.containerr} id="contact">
        {/* NAVBAR */}
        <Navbar />

        {/* HERO / BANNER SECTION */}
        <header className={styles.hero}>
          <div className={styles.heroBackground}>
            <img
              className={styles.heroImage}
              src={contactContent.hero.bannerImage}
              alt={contactContent.hero.bannerAlt}
            />
            <div className={styles.heroOverlay}></div>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroTextInner}>
              <h1 className={styles.heroTitle}>
                {contactContent.hero.title}
              </h1>
              
              <GlassButton
                label={contactContent.hero.ctaLabel}
                onClick={openStartProject}
              />
            </div>
          </div>
        </header>
      </div>

      {/* WE DO AI PRODUCTIONS MARQUEE SECTION */}
      <MarqueeSection content={contactContent} />

      <section
        className={styles.whereToFind}>
        <div className={styles.container}>
           <h1 className={styles.heroTitle} data-animate="fade-up">
                {contactContent.location.title}
              </h1>
            <div className={styles.addressBox} data-animate="fade-up">
              <span>{contactContent.location.address}</span>
            </div>
        </div>
        
      </section>  

      {/* MEET THE TEAM SECTION */}
      <section
        ref={contactTeamSectionRef}
        className={styles.selectedSection}
        id="team"
        data-animate="fade-up"
      >
        <div className={styles.selectedContainer} >
          <div className={styles.selectedHeader}>
            <div className={styles.selectedTextWrapper}>
              <h2 className={styles.selectedTitle} data-animate="fade-up">
                {contactContent.teamSection.title
                  .replace(contactContent.teamSection.highlight, "")
                  .trim()}{" "}
                <span className={styles.selectedTitleHighlight}>
                  {contactContent.teamSection.highlight}
                </span>
                <div className={styles.decorativeLine}></div>
              </h2>

              <p className={styles.selectedDescription} data-animate="fade-up">
                {contactContent.teamSection.description}
              </p>
            </div>
          </div>

          <TeamMembersGrid teamMembers={teamMembers}/>
        </div>
      </section>

      <section
        ref={contactProjectSectionRef}
        className={`${styles.startProjectSection} ${
          isStartOpen ? styles.startProjectSectionOpen : ""
        } ${isStartClosing ? styles.startProjectSectionClosing : ""}`}
        id="work"
      >
        <div className={styles.selectedContainer}>
          <div className={styles.selectedHeader}>
            <div className={styles.selectedTextWrapper}>
              <h2 className={styles.selectedTitle}>
                <div className={styles.decorativeLine}></div>
                 {contactContent.startProjectSection.title
                   .replace(contactContent.startProjectSection.highlight, "")
                   .trim()}{" "}
                  <span className={styles.selectedTitleHighlight}>
                    {contactContent.startProjectSection.highlight}
                  </span>
                 
               </h2>
               <p className={styles.selectedDescription}>
                 {contactContent.startProjectSection.description}
               </p>
             </div>
           </div>
         </div>

         {isStartOpen && (
           <button
             className={styles.startProjectBackButton}
             type="button"
             onClick={closeStartProject}
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
                fill="#ffffff"
              />
            </svg>
           </button>
         )}

         <ContactForm content={contactContent} />
       </section>


      {/* POPUP VIDEO PLAYER FOR SELECTED WORKS */}
      {(() => {
        console.log("Modal render check - isVideoModalOpen:", isVideoModalOpen, "activeVideo:", activeVideo);
        return isVideoModalOpen && activeVideo;
      })() && createPortal(
        <div
          className={styles.videoModalBackdrop}
          onClick={closeVideoModal}
        >
          <div
            className={styles.videoModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.videoModalClose}
              type="button"
              onClick={closeVideoModal}
              aria-label="Close video modal"
            >
              ✕
            </button>
            <div className={styles.videoModalHeader}>
              <h3 className={styles.videoModalTitle}>{activeVideo.title}</h3>
              <p className={styles.videoModalType}>{activeVideo.type}</p>
            </div>
            <div className={styles.videoModalBody}>
              <video
                src={activeVideo.src}
                controls
                autoPlay
                playsInline
                className={styles.videoModalVideo}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FOOTER */}
      <Footer />
    </>
  );
};

const MarqueeSection = ({ content }) => {
  const marqueeContainerRef = useRef(null);
  const firstTrackRef = useRef(null);

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
  }, []);

  const marqueeItems = content.marquee.items;

  return (
    <div className={styles.marqueeWrapper}>
      <div className={styles.marqueeContainer} ref={marqueeContainerRef}>
        <div className={styles.marqueeTrack} ref={firstTrackRef}>
          <ul>
            {marqueeItems.map((item, index) => (
              <li key={`original-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={styles.marqueeTrack}>
          <ul>
            {marqueeItems.map((item, index) => (
              <li key={`duplicate-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const VideoCard = ({ video, onClick }) => {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const wrapperRef = useRef(null);
  const overlayRef = useRef(null);
  const titleRef = useRef(null);
  const typeRef = useRef(null);
  const animationRef = useRef(null);
  const overlayAnimationRef = useRef(null);

  // Intersection Observer to load video only when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (videoRef.current && !videoRef.current.src) {
              requestAnimationFrame(() => {
                if (videoRef.current) {
                  videoRef.current.src = video.src;
                  videoRef.current.load();
                }
              });
            }
          }
        });
      },
      {
        rootMargin: "150px",
        threshold: 0.01,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [video.src]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      if (overlayAnimationRef.current) {
        overlayAnimationRef.current.kill();
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (!cardRef.current || !wrapperRef.current || !videoRef.current) return;

    if (animationRef.current) {
      animationRef.current.kill();
    }
    if (overlayAnimationRef.current) {
      overlayAnimationRef.current.kill();
    }

    animationRef.current = gsap.to(cardRef.current, {
      flex: "3.2 0 0",
      duration: 0.5,
      ease: "power2.out",
      overwrite: true,
      force3D: true,
    });

    gsap.to(wrapperRef.current, {
      boxShadow: "0 12px 36px rgba(255, 255, 255, 0.28)",
      duration: 0.3,
      ease: "power2.out",
    });

    if (overlayRef.current && titleRef.current && typeRef.current) {
      overlayRef.current.style.display = "flex";
      
      overlayAnimationRef.current = gsap.timeline();
      overlayAnimationRef.current
        .to(overlayRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        })
        .fromTo(
          titleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
          "-=0.2"
        )
        .fromTo(
          typeRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
          "-=0.3"
        );
    }

    if (videoRef.current && videoRef.current.readyState >= 2) {
      requestAnimationFrame(() => {
        if (videoRef.current) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        }
      });
    } else if (videoRef.current && !videoRef.current.src) {
      videoRef.current.src = video.src;
      videoRef.current.load();
      videoRef.current.addEventListener(
        "loadeddata",
        () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        },
        { once: true }
      );
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !wrapperRef.current || !videoRef.current) return;

    if (animationRef.current) {
      animationRef.current.kill();
    }
    if (overlayAnimationRef.current) {
      overlayAnimationRef.current.kill();
    }

    animationRef.current = gsap.to(cardRef.current, {
      flex: "1 1 0",
      duration: 0.5,
      ease: "power2.out",
      overwrite: true,
      force3D: true,
    });

    gsap.to(wrapperRef.current, {
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
      duration: 0.3,
      ease: "power2.out",
    });

    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (overlayRef.current) {
            overlayRef.current.style.display = "none";
          }
        },
      });
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleCardClick = (e) => {
    console.log("VideoCard clicked, opening modal for:", video.title);
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={cardRef}
      className={styles.videoCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div ref={wrapperRef} className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={styles.workVideo}
          preload="none"
          loop
          muted
          playsInline
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
            }
          }}
        />
        <div 
          ref={overlayRef} 
          className={styles.videoOverlay}
        >
          <h3 ref={titleRef} className={styles.videoTitle}>
            {video.title}
          </h3>
          <p ref={typeRef} className={styles.videoType}>
            {video.type}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ✅ TEAM MEMBERS GRID COMPONENT */
const TeamMembersGrid = ({ teamMembers }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const clearHoverRef = useRef(null);

  const handleHover = (id) => {
    if (clearHoverRef.current) {
      clearTimeout(clearHoverRef.current);
      clearHoverRef.current = null;
    }
    if (id !== null) {
      setHoveredId(id);
      return;
    }
    clearHoverRef.current = setTimeout(() => setHoveredId(null), 80);
  };

  useEffect(() => {
    return () => {
      if (clearHoverRef.current) clearTimeout(clearHoverRef.current);
    };
  }, []);

  return (
    <div
      className={`${styles.teamGrid} ${hoveredId ? styles.teamGridHovered : ""}`}
    >
      {teamMembers.map((member) => (
        <TeamMemberCard
          key={member.id}
          member={member}
          onHover={handleHover}
          isHovered={hoveredId}
        />
      ))}
    </div>
  );
};

/* ✅ TEAM MEMBER CARD COMPONENT */
const TeamMemberCard = ({ member, onHover, isHovered }) => {
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const contactInfoRef = useRef(null);
  const wrapperRef = useRef(null);
  const animationRef = useRef(null);
  const overlayAnimationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      if (overlayAnimationRef.current) {
        overlayAnimationRef.current.kill();
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (!contactInfoRef.current || !wrapperRef.current) return;
    onHover(member.id);

    if (overlayAnimationRef.current) {
      overlayAnimationRef.current.kill();
    }
    contactInfoRef.current.style.display = "flex";
    overlayAnimationRef.current = gsap.to(contactInfoRef.current, {
      opacity: 1,
      duration: 0.35,
      ease: "power2.out",
      overwrite: true,
    });
  };

  const handleMouseLeave = () => {
    if (!contactInfoRef.current) return;
    onHover(null);

    if (overlayAnimationRef.current) {
      overlayAnimationRef.current.kill();
    }
    gsap.to(contactInfoRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
      overwrite: true,
      onComplete: () => {
        if (contactInfoRef.current) {
          contactInfoRef.current.style.display = "none";
        }
      },
    });
  };

  // Single source of truth for flex: only useEffects drive card size (avoids glitch when switching hover)
  useEffect(() => {
    if (!cardRef.current) return;
    if (animationRef.current) {
      animationRef.current.kill();
    }
    const isMe = isHovered === member.id;
    const isOther = isHovered !== null && isHovered !== member.id;
    const flex = isMe ? "1.5 0 0" : isOther ? "0.8 1 0" : "1 1 0";
    animationRef.current = gsap.to(cardRef.current, {
      flex,
      duration: 0.4,
      ease: "power2.out",
      overwrite: true,
      force3D: true,
    });
  }, [isHovered, member.id]);

  return (
    <div
      ref={cardRef}
      className={styles.teamCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={wrapperRef} className={styles.teamCardInner}>
        {/* Yellow Header Box */}
        <div className={styles.teamHeader}>
          <h3 className={styles.teamName}>{member.name}</h3>
          <p className={styles.teamTitle}>{member.title}</p>
        </div>

        {/* Image */}
        <div className={styles.teamImageWrapper}>
          <img
            ref={imageRef}
            src={member.image}
            alt={member.name}
            className={styles.teamImage}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Contact Info Overlay */}
        <div ref={contactInfoRef} className={styles.teamContactInfo}>
          <a href={`mailto:${member.email}`} className={styles.teamEmail}>
            {member.email}
          </a>
          <a href={`tel:${member.phone}`} className={styles.teamPhone}>
            {member.phone}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;

