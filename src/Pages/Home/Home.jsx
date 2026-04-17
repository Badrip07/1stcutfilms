import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/footer/Footer";
import GlassButton from "../../Components/GlassButton/GlassButton";
import { useWorkData } from "../../hooks/useWorkData.js";
import { usePageSections } from "../../hooks/usePageSections.js";
import { homeContentDefaults } from "./homeContentDefaults.js";
import { apiUrl } from "../../lib/apiBase.js";
import { workData as bundledWorkData } from "../Work/workData.js";

const resolveHomeAssetUrl = (url = "") => {
  if (typeof url !== "string") return url;
  if (url.startsWith("/uploads/")) return apiUrl(url);
  return url;
};

/* ✅ CLIENT CARD COMPONENT */
const ClientCard = ({ item, onHover, isHovered, resolveAssetUrl }) => {
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const reviewRef = useRef(null);
  const animationRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      // Cleanup timeout
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      // Cleanup video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, []);

  // Load video only when hovered (performance optimization)
  const loadVideo = () => {
    if (videoRef.current && item.video && !isVideoLoaded) {
      videoRef.current.src = resolveAssetUrl(item.video);
      videoRef.current.load();
      setIsVideoLoaded(true);
    }
  };

  const handleMouseEnter = () => {
    if (!cardRef.current || !imageRef.current || !reviewRef.current) return;
    onHover(item.id);

    // Load video on hover
    loadVideo();

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Expand this card
    animationRef.current = gsap.to(cardRef.current, {
      flex: "1.7 0 0",
      duration: 0.5,
      ease: "power2.out",
      overwrite: true,
      force3D: true,
    });

    // Show review overlay with animation
    reviewRef.current.style.display = "flex";
    gsap.fromTo(
      reviewRef.current,
      { opacity: 0, x: 20, width: "30rem" },
      {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: "power2.out",
        force3D: true,
      }
    );

    // Hide image and show video
    if (imageRef.current) {
      gsap.to(imageRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          if (imageRef.current) {
            imageRef.current.style.display = "none";
          }
        },
      });
    }

    // Show and play video
    if (videoRef.current) {
      videoRef.current.style.display = "block";
      gsap.fromTo(
        videoRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        }
      );

      // Play video when ready
      const playVideo = () => {
        if (videoRef.current) {
          videoRef.current.muted = isMuted;
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Auto-play was prevented, ignore silently
            });
          }
        }
      };

      if (videoRef.current.readyState >= 2) {
        playVideo();
      } else {
        videoRef.current.addEventListener("loadeddata", playVideo, { once: true });
      }
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !imageRef.current || !reviewRef.current) return;
    
    // Clear any existing timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    // Use a small delay to check if another card is being hovered
    // This prevents flickering when moving between cards
    leaveTimeoutRef.current = setTimeout(() => {
      // Only reset if no other card is hovered (or this card is still not hovered)
      if (isHovered !== item.id) {
        onHover(null);
      }
      leaveTimeoutRef.current = null;
    }, 50);

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Kill any ongoing image/video animations to prevent conflicts
    if (imageRef.current) {
      gsap.killTweensOf(imageRef.current);
    }
    if (videoRef.current) {
      gsap.killTweensOf(videoRef.current);
    }

    // Always reset the card when mouse leaves
    // Shrink card back to normal
    animationRef.current = gsap.to(cardRef.current, {
      flex: "1 1 0",
      duration: 0.5,
      ease: "power2.out",
      overwrite: true,
      force3D: true,
    });

    // Hide review overlay with animation
    gsap.to(reviewRef.current, {
      opacity: 0,
      x: 20,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        if (reviewRef.current) {
          reviewRef.current.style.display = "none";
        }
      },
    });

    // Hide video first, then show image after video is fully hidden
    // Check if video is currently visible (display is block, not none)
    const videoIsVisible = videoRef.current && 
                          videoRef.current.style.display === "block";
    
    if (videoIsVisible && videoRef.current) {
      // Hide video with animation
      gsap.to(videoRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            videoRef.current.style.display = "none";
          }
          // Ensure image is shown after video is completely hidden
          if (imageRef.current) {
            imageRef.current.style.display = "block";
            gsap.to(imageRef.current, {
              opacity: 1,
              filter: "grayscale(100%) brightness(1)",
              duration: 0.3,
              ease: "power2.out",
            });
          }
        },
      });
    } else {
      // If no video or video already hidden, ensure image is visible immediately
      if (imageRef.current) {
        // Force image to be displayed and visible
        imageRef.current.style.display = "block";
        // Set opacity immediately to prevent flicker
        imageRef.current.style.opacity = "1";
        gsap.to(imageRef.current, {
          opacity: 1,
          filter: "grayscale(100%) brightness(1)",
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  };

  // Handle external hover state (for shrinking other cards)
  useEffect(() => {
    if (!cardRef.current || !isHovered || isHovered === item.id) return;

    // Shrink other cards when one is hovered
    if (animationRef.current) {
      animationRef.current.kill();
    }

    animationRef.current = gsap.to(cardRef.current, {
      flex: "0.8 1 0",
      duration: 0.5,
      ease: "power2.out",
      overwrite: true,
      force3D: true,
    });
  }, [isHovered, item.id]);

  // Reset when no card is hovered
  useEffect(() => {
    if (!isHovered && cardRef.current) {
      if (animationRef.current) {
        animationRef.current.kill();
      }
      animationRef.current = gsap.to(cardRef.current, {
        flex: "1 1 0",
        duration: 0.5,
        ease: "power2.out",
        overwrite: true,
        force3D: true,
      });
    }
  }, [isHovered]);

  // Update video muted state when isMuted changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleSound = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div
      ref={cardRef}
      className={styles.clientCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.clientCardInner}>
        <img
          ref={imageRef}
          src={resolveAssetUrl(item.img)}
          alt={item.name}
          className={styles.clientImg}
          loading="lazy"
          decoding="async"
        />

        {item.video && (
          <video
            ref={videoRef}
            className={styles.clientVideo}
            preload="none"
            loop
            playsInline
            muted={isMuted}
            style={{ display: "none", opacity: 0 }}
          />
        )}

        {/* Sound Toggle Button */}
        {item.video && isHovered === item.id && (
          <button
            className={styles.soundToggle}
            onClick={toggleSound}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        )}

        <div ref={reviewRef} className={styles.reviewCard}>
          <div className={styles.reviewContent}>
            <h3 className={styles.reviewName}>{item.name}</h3>
            <p className={styles.reviewRole}>{item.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const GlassButton_OLD_DELETE = ({ onClick, label = "START A PROJECT" }) => {
  const buttonRef = useRef(null);
  const blobRef = useRef(null);

  const handleMouseEnter = () => {
    if (blobRef.current) {
      blobRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    if (blobRef.current) {
      blobRef.current.style.opacity = "0";
    }
  };

  const handleMouseMove = (e) => {
    const button = buttonRef.current;
    const blob = blobRef.current;
    if (!button || !blob) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    blob.style.transform = `translate(${x - 100}px, ${y - 100}px)`;
  };
 
  return (
    <button
      ref={buttonRef}
      className={styles.glassBtn}
      type="button"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <span>{label}</span>
      <div ref={blobRef} className={styles.blob} />
    </button>
  );
};

const Home = () => {
  const resolveAssetUrl = resolveHomeAssetUrl;

  const { workData: portfolio } = useWorkData();
  const { sections: pageSections } = usePageSections("home");
  const navigate = useNavigate();
  const logosSectionRef = useRef(null);
  const selectedSectionRef = useRef(null);
  const clientSectionRef = useRef(null);
  const caseSectionRef = useRef(null);
  const projectSectionRef = useRef(null);
  const servicesSectionRef = useRef(null);

  // Logos grid lines grow in when section scrolls into view
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = logosSectionRef.current;
    if (!section) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      onEnter: () => section.classList.add(styles.logosLinesInView),
      onLeaveBack: () => section.classList.remove(styles.logosLinesInView),
    });

    return () => {
      trigger.kill();
    };
  }, []);

  // Heading line draw on scroll: SELECTED WORKS, CLIENT WORDS, CLIENT CASE, PROJECT, SERVICES
  const headingLineSections = [
    { ref: selectedSectionRef, classInView: styles.selectedLineInView },
    { ref: clientSectionRef, classInView: styles.clientLineInView },
    { ref: caseSectionRef, classInView: styles.caseLineInView },
    { ref: projectSectionRef, classInView: styles.projectLineInView },
    { ref: servicesSectionRef, classInView: styles.servicesLinesInView },
  ];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const triggers = headingLineSections
      .map(({ ref, classInView }) => {
        const section = ref.current;
        if (!section) return null;
        return ScrollTrigger.create({
          trigger: section,
          start: "top 75%",
          onEnter: () => section.classList.add(classInView),
          onLeaveBack: () => section.classList.remove(classInView),
        });
      })
      .filter(Boolean);

    return () => triggers.forEach((t) => t?.kill());
  }, []);

  // 3D tilt / depth effect for all hero CTA-style buttons on this page
  useEffect(() => {
    // Apply effect to both main CTA buttons and the "WANT A FREE PITCH?" button
    const buttons = document.querySelectorAll(
      `.${styles.heroCta}, .${styles.projectButton}`
    );

    const maxTilt = 12;
    const maxDepth = 10;
    const maxMove = 2; // button movement px

    const listeners = [];

    buttons.forEach((button) => {
      const handleMouseMove = (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const percentX = (x - centerX) / centerX; // -1 (left) to 1 (right)
        const percentY = (y - centerY) / centerY;

        const rotateY = percentX * maxTilt;
        const rotateX = -percentY * maxTilt;

        // Move button opposite to cursor (depth illusion)
        const moveX = -percentX * maxMove;
        const moveY = -percentY * maxMove;

        const shadowX = -percentX * maxDepth;
        const shadowY = -percentY * maxDepth;

        button.style.transform = `
          perspective(700px)
          translate(${moveX}px, ${moveY}px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
        `;

        // Banner-style soft glow for project button; depth shadow for hero CTA
        const isProjectBtn = button.classList.contains(styles.projectButton);
        button.style.boxShadow = isProjectBtn
          ? `${shadowX}px ${shadowY}px 0px 8px rgb(190 190 190)`
          : `
          ${shadowX}px ${shadowY}px 0 hsla(0, 0%, 38%, 0.85),
          ${shadowX * 1.6}px ${shadowY * 1.6}px 30px rgba(0,0,0,0.4)
        `;

        // Dynamic gradient: move balance between dark and light based on cursor X
        // When cursor moves right -> more white, less dark
        // When cursor moves left  -> more dark, less white
        const mixPoint = Math.max(20, Math.min(80, 50 - percentX * 20)); // 20–80%

        button.style.backgroundImage = `linear-gradient(
          135deg,
          rgb(255 255 255) 0%,
          rgb(145 145 145 / 95%) ${mixPoint}%,
          rgb(41 41 41 / 95%) 100%
        )`;
      };

      const handleMouseLeave = () => {
        button.style.transform = "none";
        button.style.boxShadow = "none";
        button.style.backgroundImage = "";
      };

      button.addEventListener("mousemove", handleMouseMove);
      button.addEventListener("mouseleave", handleMouseLeave);

      listeners.push({ button, handleMouseMove, handleMouseLeave });
    });

    return () => {
      listeners.forEach(({ button, handleMouseMove, handleMouseLeave }) => {
        button.removeEventListener("mousemove", handleMouseMove);
        button.removeEventListener("mouseleave", handleMouseLeave);
        button.style.transform = "none";
        button.style.boxShadow = "none";
      });
    };
  }, []);

  // Dedicated 3D depth + shadow effect for all hero3d-style buttons (banner button style)
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

  // Scroll-triggered fade-in-up animation for all main sections (except header & footer)
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

  // Services section: fade-up + zoom-in on scroll for each service card (images)
  useEffect(() => {
    const section = servicesSectionRef.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);
    const cards = section.querySelectorAll(`.${styles.serviceCard}`);
    if (!cards.length) return;

    const anims = gsap.fromTo(
      cards,
      { opacity: 0, y: 60, scale: 0.78 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 2.6,
        ease: "power3.out",
        stagger: 0.4,
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      anims.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === section) t.kill();
      });
    };
  }, []);

  const homeContent = useMemo(() => {
    const fromCms = pageSections?.home_content || {};
    return {
      hero: { ...homeContentDefaults.hero, ...(fromCms.hero || {}) },
      marquee: {
        ...homeContentDefaults.marquee,
        ...(fromCms.marquee || {}),
        items: Array.isArray(fromCms.marquee?.items)
          ? fromCms.marquee.items
          : homeContentDefaults.marquee.items,
      },
      logos: {
        ...homeContentDefaults.logos,
        ...(fromCms.logos || {}),
        items: Array.isArray(fromCms.logos?.items)
          ? fromCms.logos.items
          : homeContentDefaults.logos.items,
      },
      selectedWorks: {
        ...homeContentDefaults.selectedWorks,
        ...(fromCms.selectedWorks || {}),
        videos: Array.isArray(fromCms.selectedWorks?.videos)
          ? fromCms.selectedWorks.videos
          : homeContentDefaults.selectedWorks.videos,
      },
      clientWords: {
        ...homeContentDefaults.clientWords,
        ...(fromCms.clientWords || {}),
        reviews: Array.isArray(fromCms.clientWords?.reviews)
          ? fromCms.clientWords.reviews
          : homeContentDefaults.clientWords.reviews,
      },
      services: {
        ...homeContentDefaults.services,
        ...(fromCms.services || {}),
        items: Array.isArray(fromCms.services?.items)
          ? fromCms.services.items
          : homeContentDefaults.services.items,
      },
      caseSection: { ...homeContentDefaults.caseSection, ...(fromCms.caseSection || {}) },
      project: { ...homeContentDefaults.project, ...(fromCms.project || {}) },
    };
  }, [pageSections]);

  const videoWorks = homeContent.selectedWorks.videos;
  const clientReviews = homeContent.clientWords.reviews;
  const services = homeContent.services.items;
  const videoPortfolioPosts =
    Array.isArray(portfolio?.video) && portfolio.video.length > 0
      ? portfolio.video
      : bundledWorkData.video || [];
  const configuredCaseItems = Array.isArray(homeContent.caseSection?.items)
    ? homeContent.caseSection.items
    : [];
  const resolvedCasePosts = configuredCaseItems
    .map((item) => {
      const workId = Number.parseInt(item?.workId ?? item?.id, 10);
      if (Number.isNaN(workId)) return null;
      const post = videoPortfolioPosts.find((p) => Number(p.id) === workId);
      if (!post) return null;
      return { post, config: item };
    })
    .filter(Boolean);
  const casePosts =
    resolvedCasePosts.length > 0
      ? resolvedCasePosts
      : videoPortfolioPosts.slice(0, 3).map((post) => ({ post, config: null }));

  // Popup player state for Selected Works videos
  const [activeVideo, setActiveVideo] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleVideoClick = (video) => {
    if (!video) {
      console.log("handleVideoClick called with no video");
      return;
    }
    console.log("Video clicked:", video); // Debug log
    console.log("Setting activeVideo and opening modal");
    setActiveVideo(video);
    setIsVideoModalOpen(true);
    console.log("State should be updated now");
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    // Delay clearing active video slightly to let exit animation (if any) play smoothly
    setTimeout(() => {
      setActiveVideo(null);
    }, 200);
  };

  return (
    <>
      <div className={styles.containerr} id="home">
        {/* NAVBAR */}
        <Navbar />

        {/* HERO SECTION */}
        <header className={styles.hero}>
          <div className={styles.heroBackground}>
            <video
              className={styles.heroVideo}
              src={resolveAssetUrl(homeContent.hero.backgroundVideo)}
              autoPlay
              loop
              muted
              playsInline
            />

          </div>

          <div className={styles.heroContent}>
            {/* <h2 className={styles.heroBrand}>PRITESH PHOTOGRAPHY</h2> */}

            <div className={styles.heroTextInner}>
              <div className={styles.heroBadgeWrapper}>
                <img
                  src={resolveAssetUrl(homeContent.hero.badgeImage)}
                  alt="Badge"
                  className={styles.badgeImage}
                />
              </div>

              <h1 className={styles.heroTitle}>
                {homeContent.hero.titlePrefix} <span className={styles.highlight}>{homeContent.hero.titleHighlight}</span>
                <br />
                {homeContent.hero.titleSuffix}
              </h1>

              <p className={styles.heroDescription}>
                {homeContent.hero.description}
              
              </p>
{/* 
              <button
                className={styles.hero3dBtn}
                type="button"
                onClick={() =>
                  navigate("/contact", {
                    state: { openStartProjectFromHome: true },
                  })
                }
              >
                <span className={styles.hero3dInner}>START A PROJECT</span>
              </button> */}

              <GlassButton
                label={homeContent.hero.ctaLabel}
                onClick={() =>
                  navigate("/contact", {
                    state: { openStartProjectFromHome: true },
                  })
                }
              />
            </div>
          </div>
        </header>
      </div>

      {/* MARQUEE SECTION */}
      <MarqueeSection marqueeItems={homeContent.marquee.items} />

      {/* LOGOS SECTION */}
      <section
        ref={logosSectionRef}
        className={styles.logosSection}
        data-animate="fade-up"
      > 
        <div className={styles.logosInner}>
          <div className={styles.logosGrid}>
            {homeContent.logos.items.map((src, idx) => (
              <div className={styles.logoCell} key={idx}>
                <div className={styles.logoBox}>
                  <img
                    src={resolveAssetUrl(src)}
                    alt={`client-${idx + 1}`}
                    className={styles.logoImg}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className={styles.logosNote}>{homeContent.logos.note}</p>
      </section>

      {/* SELECTED WORKS SECTION */}
      <section
        ref={selectedSectionRef}
        className={styles.selectedSection}
        id="work"
        data-animate="fade-up"
      >
        <div className={styles.selectedContainer}>
          <div className={styles.selectedHeader}>
            <div className={styles.selectedTextWrapper}>
              <h2 className={styles.selectedTitle}>
                {homeContent.selectedWorks.titlePrefix}{" "}
                <span className={styles.selectedTitleHighlight}>{homeContent.selectedWorks.titleHighlight}</span>
                <div className={styles.decorativeLine}></div>
              </h2>

              <p className={styles.selectedDescription}>{homeContent.selectedWorks.description}</p>
            </div>
          </div>

          <div className={styles.videoGrid}>
            {videoWorks.slice(0, 5).map((work) => (
              <VideoCard
                key={work.id}
                video={work}
                onClick={() => handleVideoClick(work)}
              />
            ))}
          </div>

          <div className={styles.morebtn}>
            <GlassButton
              label={homeContent.selectedWorks.moreWorkLabel}
              onClick={() => navigate("/work")}
            />
          </div>
        </div>
      </section>

      {/* CLIENT WORDS SECTION */}
      <section
        ref={clientSectionRef}
        className={styles.clientSection}
        data-animate="fade-up"
      >
        <div className={styles.clientHeader}>
          <div className={styles.clientTitleWrapper}>
            <div className={styles.clientLine}></div>
            <h2 className={styles.clientTitle}>
              {homeContent.clientWords.titlePrefix} <span className={styles.clientTitleHighlight}>{homeContent.clientWords.titleHighlight}</span>
            </h2>
          </div>
          <p className={styles.clientDescription}>{homeContent.clientWords.description}</p>
        </div>

        <ClientWordsGrid clientReviews={clientReviews} resolveAssetUrl={resolveAssetUrl} />
        
      </section>

      {/* SERVICES SECTION */}
      <section
        ref={servicesSectionRef}
        className={styles.servicesSection}
        id="services"
      >
        <div className={styles.servicesContainer}>
          <div className={styles.servicesGrid}>
            {services.map((service) => (
              <div key={service.id} className={styles.serviceCard}>
                <div
                  className={`${styles.imageSection} ${
                    service.id === 2 ? styles.imageSectionTextured : ""
                  }`}
                >
                  <div
                    className={`${styles.serviceIcon} ${
                      styles[service.animationType]
                    }`}
                  >
                    <img
                      src={resolveAssetUrl(service.icon)}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                <div
                  className={`${styles.contentSection} ${
                    service.id === 1 || service.id === 3
                      ? styles.contentSectionTextured
                      : ""
                  }`}
                >
                  <h2 className={styles.serviceTitle}>{service.title}</h2>
                  <p className={styles.serviceDescription}>
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.buttonWrapper}>
          <GlassButton
            label={homeContent.services.readMoreLabel}
            onClick={() => navigate("/about")}
          />
        </div>
      </section>

      {/* CLIENT CASE SECTION */}
      <section
        ref={caseSectionRef}
        className={styles.caseSection}
       
      >
        <div className={styles.caseContainer}>
          <div className={styles.caseHeader}>
            <div className={styles.caseLineLeft}></div>
            <h2 className={styles.caseTitle}  data-animate="fade-up">
              {homeContent.caseSection.titlePrefix} <span className={styles.caseTitleHighlight}>{homeContent.caseSection.titleHighlight}</span>
            </h2>
          </div>

          <div className={styles.caseItems}>
            {casePosts.map(({ post, config }, idx) => {
              const rawVideo = post.vimeoUrl || post.video;
              const isVimeo = typeof rawVideo === "string" && rawVideo.includes("vimeo.com");
              const postTitle = config?.titleOverride || post.subtitle || post.category || post.title || "CREATIVE BRANDFILM";
              const postDescription =
                config?.descriptionOverride ||
                post.content ||
                homeContent.caseSection.fallbackDescription;

              let vimeoId = null;
              if (isVimeo) {
                try {
                  const url = new URL(rawVideo);
                  const parts = url.pathname.split("/").filter(Boolean);
                  const last = parts[parts.length - 1];
                  if (last && /^\d+$/.test(last)) {
                    vimeoId = last;
                  }
                } catch {
                  vimeoId = null;
                }
              }

              return (
                <div key={`${post.id}-${idx}`} className={styles.caseItem}>
                  <div className={styles.caseVideo} data-animate="fade-up">
                    {vimeoId ? (
                      <iframe
                        src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&controls=0`}
                        className={styles.caseVideoPlayer}
                        title={post.title}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={resolveAssetUrl(post.video)}
                        poster={resolveAssetUrl(post.thumbnail)}
                        preload="auto"
                        loop
                        muted
                        autoPlay
                        playsInline
                        className={styles.caseVideoPlayer}
                      />
                    )}
                    <div className={styles.caseVideoOverlay}>
                      {post.brandImage && (
                        <img
                          src={resolveAssetUrl(post.brandImage)}
                          alt={`${post.title} brand`}
                          className={styles.caseBrandCenter}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                  </div>

                  <div className={styles.caseContent}>
                    <h3 className={styles.caseProjectTitle} data-animate="fade-up">
                      {postTitle.toUpperCase()}
                    </h3>
                    <div data-animate="fade-up">
                      <GlassButton
                        label={homeContent.caseSection.viewCaseLabel}
                        onClick={() =>
                          navigate(`/work/${post.id}`, { state: { post, category: "video" } })
                        }
                      />
                    </div>
                    <p className={styles.caseDescription} data-animate="fade-up">
                      {postDescription}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
                src={resolveAssetUrl(activeVideo.src)}
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

      {/* PROJECT SECTION */}
      <section
        ref={projectSectionRef}
        className={styles.projectSection}
        id="contact"
        data-animate="fade-up"
      >
        <div className={styles.projectContainer}>
          <div className={styles.projectImageWrapper}>
            <img
              src={resolveAssetUrl(homeContent.project.image)}
              alt={homeContent.project.imageAlt}
              className={styles.projectImage}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className={styles.projectContent}>
            <div className={styles.projectHeader}>
              <h2 className={styles.projectTitle}>{homeContent.project.title}</h2>
              <div className={styles.projectLine}></div>
            </div>
            <div>
             <GlassButton
               label={homeContent.project.ctaLabel}
               onClick={() =>
                 navigate("/contact", {
                   state: { openStartProjectFromHome: true },
                 })
               }
             />
            </div>
            <p className={styles.projectDescription}>{homeContent.project.description1}</p>
            <p className={styles.projectDescription}>{homeContent.project.description2}</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </>
  );
};

/* ✅ CLIENT WORDS GRID COMPONENT */
const ClientWordsGrid = ({ clientReviews, resolveAssetUrl }) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className={styles.clientGridContainer}>
      {clientReviews.map((item) => (
        <ClientCard
          key={item.id}
          item={item}
          onHover={setHoveredId}
          isHovered={hoveredId}
          resolveAssetUrl={resolveAssetUrl}
        />
      ))}
    </div>
  );
};

/* ✅ MARQUEE COMPONENT */
const MarqueeSection = ({ marqueeItems = [] }) => {
  const marqueeContainerRef = useRef(null);
  const firstTrackRef = useRef(null);

  useEffect(() => {
    const container = marqueeContainerRef.current;
    const firstTrack = firstTrackRef.current;

    if (!container || !firstTrack) return;

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const initAnimation = () => {
      // Get the width of one track (original or duplicate, they're the same)
      const trackWidth = firstTrack.scrollWidth;
      
      if (trackWidth === 0) {
        requestAnimationFrame(initAnimation);
        return;
      }

      // Create GSAP animation for smooth infinite scroll
      // Adjust speed by changing the divisor (150 = slower, 100 = faster)
      const speed = trackWidth / 100;
      
      // Animate the container to move left
      gsap.to(container, {
        x: -trackWidth,
        duration: speed,
        ease: "none",
        repeat: -1,
        force3D: true,
        immediateRender: false,
      });
    };

    // Small delay to ensure layout is complete
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
  const [isInView, setIsInView] = useState(false);

  // Intersection Observer to load video only when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Load video source when in viewport with a small delay to prevent simultaneous loads
            if (videoRef.current && !videoRef.current.src) {
              // Use requestAnimationFrame to prevent blocking
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
        rootMargin: "150px", // Start loading 150px before entering viewport
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
    // Cleanup animation on unmount
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

    // Kill any existing animations
    if (animationRef.current) {
      animationRef.current.kill();
    }
    if (overlayAnimationRef.current) {
      overlayAnimationRef.current.kill();
    }

    // Animate card expansion with GSAP
    animationRef.current = gsap.to(cardRef.current, {
      flex: "3.2 0 0",
      duration: 0.5,
      ease: "power2.out",
      overwrite: true,
      force3D: true,
    });

    // Show overlay with title and type
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

    // Play video smoothly - only if video is loaded
    if (videoRef.current && videoRef.current.readyState >= 2) {
      requestAnimationFrame(() => {
        if (videoRef.current) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Auto-play was prevented, ignore silently
            });
          }
        }
      });
    } else if (videoRef.current && !videoRef.current.src) {
      // If video not loaded yet, load it now
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

    // Kill any existing animations
    if (animationRef.current) {
      animationRef.current.kill();
    }
    if (overlayAnimationRef.current) {
      overlayAnimationRef.current.kill();
    }

    // Animate card back to normal size
    animationRef.current = gsap.to(cardRef.current, {
      flex: "1 1 0",
      duration: 0.5,
      ease: "power2.out",
      overwrite: true,
      force3D: true,
    });

    // Hide overlay
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

    // Pause video
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
            // Ensure video is ready
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
            }
          }}
        />
        {/* Overlay with title and type */}
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

export default Home;
