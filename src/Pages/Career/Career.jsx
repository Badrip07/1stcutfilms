import React, { useRef, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Career.module.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/footer/Footer";
import CareerJobCard from "./CareerJobCard.jsx";
import { usePageSections } from "../../hooks/usePageSections.js";
import { useCareerPosts } from "../../hooks/useCareerPosts.js";
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
    <div className={styles.marqueeWrapper}>
      <div className={styles.marqueeContainer} ref={marqueeContainerRef}>
        <div className={styles.marqueeTrack} ref={firstTrackRef}>
          <ul>
            {list.map((item, index) => (
              <li key={`original-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={styles.marqueeTrack}>
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

const Career = () => {
  const openPositionsContainerRef = useRef(null);
  const { sections: pageSections } = usePageSections("career");
  const { posts: jobs } = useCareerPosts();

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
      openPositions: {
        ...careerContentDefaults.openPositions,
        ...(fromCms.openPositions || {}),
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

  useEffect(() => {
    const buttons = document.querySelectorAll(`.${styles.applyNowButton}, .${styles.jobApplyButton}`);
    if (!buttons || buttons.length === 0) return;

    const handlers = Array.from(buttons).map((button) => {
      const handleMouseMove = (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const percentX = (x - centerX) / centerX;
        const percentY = (y - centerY) / centerY;

        const moveX = (centerX - x) / 20;
        const moveY = (centerY - y) / 20;

        button.style.boxShadow = `${moveX}px ${moveY}px 0px 8px rgb(190 190 190)`;

        const gradientAngle = 135 + percentX * 45;
        const lightPosition = Math.max(0, Math.min(100, 50 - percentX * 30));

        button.style.backgroundImage = `linear-gradient(
          ${gradientAngle}deg,
          rgb(255 255 255) 0%,
          rgb(145 145 145 / 95%) ${lightPosition}%,
          rgb(41 41 41 / 95%) 100%
        )`;

        button.style.transform = `
          translateZ(20px)
          rotateX(${-(y - centerY) / 6}deg)
          rotateY(${(x - centerX) / 6}deg)
        `;
      };

      const handleMouseLeave = () => {
        button.style.transform = "translateZ(0) rotateX(0) rotateY(0)";
        button.style.boxShadow = "none";
        button.style.backgroundImage = "";
      };

      button.addEventListener("mousemove", handleMouseMove);
      button.addEventListener("mouseleave", handleMouseLeave);

      return { button, handleMouseMove, handleMouseLeave };
    });

    return () => {
      handlers.forEach(({ button, handleMouseMove, handleMouseLeave }) => {
        button.removeEventListener("mousemove", handleMouseMove);
        button.removeEventListener("mouseleave", handleMouseLeave);
        button.style.transform = "none";
        button.style.boxShadow = "none";
        button.style.backgroundImage = "";
      });
    };
  }, [jobs]);

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

  useEffect(() => {
    const container = openPositionsContainerRef.current;
    if (!container) return;

    const header = container.querySelector(`.${styles.openPositionsHeader}`);
    const cards = container.querySelectorAll(`.${styles.jobCard}`);

    const tweens = [];

    tweens.push(
      gsap.fromTo(
        container,
        { "--career-vertical-line-scale": 0 },
        {
          "--career-vertical-line-scale": 1,
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

    if (header) {
      tweens.push(
        gsap.fromTo(
          header,
          { "--career-header-line-scale": 0 },
          {
            "--career-header-line-scale": 1,
            ease: "none",
            scrollTrigger: {
              trigger: header,
              start: "top 90%",
              end: "top 10%",
              scrub: true,
            },
          }
        )
      );
    }

    tweens.push(
      ...Array.from(cards).map((card) =>
        gsap.fromTo(
          card,
          { "--career-card-line-scale": 0 },
          {
            "--career-card-line-scale": 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              end: "top 10%",
              scrub: true,
            },
          }
        )
      )
    );

    return () => {
      tweens.forEach((tween) => tween.kill());
    };
  }, [jobs]);

  const heroVideo = resolveAssetUrl(careerPage.hero.backgroundVideo);

  return (
    <>
      <div className={styles.containerr} id="career">
        <Navbar />

        <header className={styles.hero}>
          <div className={styles.heroBackground}>
            <video
              className={styles.heroVideo}
              src={heroVideo}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className={styles.heroOverlay}></div>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroTextInner}>
              <h1 className={styles.heroTitle}>{careerPage.hero.title}</h1>
            </div>
          </div>
        </header>
      </div>

      <MarqueeSection items={careerPage.marquee.items} />

      <section className={styles.openPositionsSection}>
        <div className={styles.openPositionsContainer} ref={openPositionsContainerRef}>
          <div className={styles.openPositionsHeader} data-animate="fade-up">
            <h2 className={styles.openPositionsTitle}>
              <span className={styles.highlight}>{careerPage.openPositions.titlePrefix}</span>{" "}
              {careerPage.openPositions.titleHighlight}
            </h2>
          </div>

          <div className={styles.jobsGrid} data-animate="fade-up">
            {jobs.map((job) => (
              <CareerJobCard
                key={job.id}
                job={job}
                resolveAssetUrl={resolveAssetUrl}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Career;
