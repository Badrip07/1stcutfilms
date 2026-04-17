import React, { useRef, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./about.module.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/footer/Footer";
import { usePageSections } from "../../hooks/usePageSections.js";
import { aboutContentDefaults } from "./aboutContentDefaults.js";
import { apiUrl } from "../../lib/apiBase.js";

const resolveAboutAssetUrl = (url = "") => {
  if (typeof url !== "string") return url;
  if (url.startsWith("/uploads/")) return apiUrl(url);
  return url;
};

const MarqueeSection = ({ items }) => {
  const marqueeContainerRef = useRef(null);
  const firstTrackRef = useRef(null);
  const list = Array.isArray(items) && items.length ? items : aboutContentDefaults.marquee.items;

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

const About = () => {
  const timelineColumnRef = useRef(null);
  const timelineLineRef = useRef(null);
  const serviceSectionRef = useRef(null);
  const { sections: pageSections } = usePageSections("about");

  const aboutContent = useMemo(() => {
    const fromCms = pageSections?.about_content || {};
    return {
      hero: { ...aboutContentDefaults.hero, ...(fromCms.hero || {}) },
      marquee: {
        ...aboutContentDefaults.marquee,
        ...(fromCms.marquee || {}),
        items: Array.isArray(fromCms.marquee?.items)
          ? fromCms.marquee.items
          : aboutContentDefaults.marquee.items,
      },
      timeline: {
        ...aboutContentDefaults.timeline,
        ...(fromCms.timeline || {}),
        items: Array.isArray(fromCms.timeline?.items)
          ? fromCms.timeline.items
          : aboutContentDefaults.timeline.items,
      },
      gallery: {
        ...aboutContentDefaults.gallery,
        ...(fromCms.gallery || {}),
        items: Array.isArray(fromCms.gallery?.items)
          ? fromCms.gallery.items
          : aboutContentDefaults.gallery.items,
      },
      servicesSection: {
        ...aboutContentDefaults.servicesSection,
        ...(fromCms.servicesSection || {}),
        items: Array.isArray(fromCms.servicesSection?.items)
          ? fromCms.servicesSection.items
          : aboutContentDefaults.servicesSection.items,
      },
      family: { ...aboutContentDefaults.family, ...(fromCms.family || {}) },
    };
  }, [pageSections]);

  const services = aboutContent.servicesSection.items;
  const galleryItems = aboutContent.gallery.items;
  const timelineItems = aboutContent.timeline.items;

  // Heading line draw on scroll: OUR SERVICES
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = serviceSectionRef.current;
    if (!section) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 75%",
      onEnter: () => section.classList.add(styles.serviceLineInView),
      onLeaveBack: () => section.classList.remove(styles.serviceLineInView),
    });

    return () => trigger.kill();
  }, []);

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
          duration: 0.3,
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

  // Vertical timeline line grow animation on scroll
  useEffect(() => {
    const column = timelineColumnRef.current;
    const line = timelineLineRef.current;

    if (!column || !line) return;

    const tween = gsap.fromTo(
      line,
      { height: 0 },
      {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: column,
          start: "top 75%",
          end: "bottom 80%",
          scrub: true,
        },
      }
    );

    return () => {
      tween.kill();
    };
  }, [timelineItems.length]);

  // Horizontal line under each timeline title grows with scroll
  useEffect(() => {
    const titles = document.querySelectorAll(`.${styles.timelineTitle}`);

    const tweens = Array.from(titles).map((title) =>
      gsap.fromTo(
        title,
        { "--line-scale": 0 },
        {
          "--line-scale": 1,
          ease: "none",
          scrollTrigger: {
            trigger: title,
            start: "top 80%",
            end: "top 40%",
            scrub: true,
          },
        }
      )
    );

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, [timelineItems]);

  // Service section horizontal divider line draws on scroll
  useEffect(() => {
    const cards = document.querySelectorAll(`.${styles.serviceCard}`);

    const tweens = Array.from(cards).map((card) =>
      gsap.fromTo(
        card,
        { "--service-divider-scale": 0 },
        {
          "--service-divider-scale": 1,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            end: "top 10%",
            scrub: true,
          },
        }
      )
    );

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, [services]);

  // Service section vertical divider line draws on scroll
  useEffect(() => {
    const contents = document.querySelectorAll(`.${styles.contentSection}`);

    const tweens = Array.from(contents).map((section) =>
      gsap.fromTo(
        section,
        { "--service-vertical-scale": 0 },
        {
          "--service-vertical-scale": 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            end: "top 10%",
            scrub: true,
          },
        }
      )
    );

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, [services]);

  // ABOUT PAGE IMAGE GROUP – staggered fade-up for all images
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const imageGroup = document.querySelector(`.${styles.imageGroup}`);
    if (!imageGroup) return;

    const imageBlocks = gsap.utils.toArray(`${`.` + styles.imageGroup} > div`);
    if (!imageBlocks.length) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: imageGroup,
        start: "top 80%",
        toggleActions: "restart none none reset",
      },
    });

    tl.fromTo(
      imageBlocks,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.15,
      }
    );

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }, [galleryItems]);

  const heroVideo = resolveAboutAssetUrl(aboutContent.hero.backgroundVideo);

  return (
    <>
      <div className={styles.containerr} id="about">
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
              <h1 className={styles.heroTitle}>{aboutContent.hero.title}</h1>
              <h2 className={styles.heroSubTitle}>{aboutContent.hero.subtitle}</h2>

              <p className={styles.heroDescription}>{aboutContent.hero.description}</p>
            </div>
          </div>
        </header>
      </div>

      <MarqueeSection items={aboutContent.marquee.items} />

      <section className={styles.aboutSection}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.timelineColumn} ref={timelineColumnRef}>
              <div className={styles.timelineLine} ref={timelineLineRef}></div>
              {timelineItems.map((entry, idx) => (
                <div key={`${entry.title}-${idx}`} className={styles.timelineItem} data-animate="fade-up">
                  <h3 className={styles.timelineTitle}>{entry.title}</h3>
                  <p className={styles.timelineText}>{entry.text}</p>
                </div>
              ))}
            </div>

            <div className={styles.col6}>
              <div className={styles.imageGroup}>
                {galleryItems.map((img, idx) => (
                  <div key={`${img.src}-${idx}`}>
                    <img
                      src={resolveAboutAssetUrl(img.src)}
                      alt={img.alt || `About ${idx + 1}`}
                      className={
                        img.variant === "wide" ? styles.aboutImageWide : styles.aboutImage
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={serviceSectionRef} className={styles.serviceSection} id="services">
        <div className={styles.container}>
          <div className={styles.serviceHeader}>
            <div className={styles.serviceTitleWrapper}>
              <div className={styles.serviceLine}></div>
              <h2 className={styles.serviceTitle} data-animate="fade-up">
                {aboutContent.servicesSection.titlePrefix}{" "}
                <span className={styles.serviceTitleHighlight}>
                  {aboutContent.servicesSection.titleHighlight}
                </span>
              </h2>
            </div>
            <p className={styles.serviceDescription} data-animate="fade-up">
              {aboutContent.servicesSection.description1}
            </p>
            <p className={styles.serviceDescription} data-animate="fade-up">
              {aboutContent.servicesSection.description2}
            </p>
          </div>

          <div className={styles.servicesGrid}>
            {services.map((service, index) => {
              const n = services.length;
              const isMiddle = n === 3 && index === 1;
              const isSideTextured = n === 3 && (index === 0 || index === 2);
              return (
              <div
                key={service.id ?? index}
                className={`${styles.serviceCard} ${isMiddle ? styles.middleBoxService : ""}`}
                data-animate="fade-up"
              >
                <div
                  className={`${styles.imageSection} ${
                    isMiddle ? styles.imageSectionTextured : ""
                  }`}
                >
                  <div
                    className={`${styles.serviceIcon} ${styles[service.animationType] || ""}`}
                  >
                    <img
                      src={resolveAboutAssetUrl(service.icon)}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      data-animate="fade-up"
                    />
                  </div>
                </div>

                <div
                  className={`${styles.contentSection} ${
                    isSideTextured ? styles.contentSectionTextured : ""
                  }`}
                >
                  <h2 className={styles.serviceTitle} data-animate="fade-up">
                    {service.title}
                  </h2>
                  <p className={styles.serviceDescription} data-animate="fade-up">
                    {service.description}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      <section className={styles.aboutFamilySection}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.col6} data-animate="fade-up">
              <img
                src={resolveAboutAssetUrl(aboutContent.family.image)}
                alt={aboutContent.family.imageAlt}
                className={styles.familyImage}
              />
            </div>
            <div className={styles.col6} data-animate="fade-up">
              <div className={styles.aboutFamilySectionInner}>
                <h2 className={styles.familyTitle}>{aboutContent.family.title}</h2>
                <p className={styles.familyDescription}>{aboutContent.family.description1}</p>
                <p className={styles.familyDescription}>{aboutContent.family.description2}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default About;
