// src/Components/footer/Footer.jsx
import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Footer.module.css";

const Footer = () => {
  const marqueeContainerRef = useRef(null);
  const firstTrackRef = useRef(null);
  const footerRef = useRef(null);

  // Footer lines draw in when section scrolls into view
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const footer = footerRef.current;
    if (!footer) return;

    const trigger = ScrollTrigger.create({
      trigger: footer,
      start: "top 85%",
      onEnter: () => footer.classList.add(styles.footerLinesInView),
      onLeaveBack: () => footer.classList.remove(styles.footerLinesInView),
    });

    return () => {
      trigger.kill();
    };
  }, []);

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

  const marqueeItems = [
    "@PRITESH_PHOTOGRAPHY",
    "@PRITESH_PHOTOGRAPHY",
    "@PRITESH_PHOTOGRAPHY",
    "@PRITESH_PHOTOGRAPHY",
    "@PRITESH_PHOTOGRAPHY",
  ];

  return (
    <footer ref={footerRef} className={styles.footer}>
      {/* MARQUEE SECTION */}
      <div className={styles.footerMarquee}>
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

      {/* MAIN FOOTER CONTENT */}
      <div className={styles.footerContent}>
        <div className={styles.mainContainer}>
          {/* LEFT SECTION - BRAND + CROSS + BADGE */}
          <div className={styles.leftSection}>
            <div className={styles.brandWrapper}>
              <div className={styles.brandTextBlock}>
                <img
                  src="/1st-cut-logo.png"
                  alt="Prites Photography"
                  className={styles.footerBrandLogo}
                />
              </div>

              {/* PLUS CROSS LINES */}
              <span className={styles.brandCross} />
              <span className={styles.brandCrossBottom} />
            </div>

            {/* YELLOW BADGE */}
            <div className={styles.badgeContainer}>
              <img src="/logo.png" alt="Logo" className={styles.badgeImg} />
            </div>
          </div>

          {/* RIGHT SECTION - GRID (2x2) */}
          <div className={styles.rightSection}>
            {/* ADDRESS */}
            <div className={styles.gridCell}>
              <div className={styles.addressCell}>
                <p className={styles.addressText}>
                  YOUR STUDIO NAME
                  <br />
                  YOUR ADDRESS LINE
                  <br />
                  YOUR CITY / REGION
                </p>
              </div>
            </div>

            {/* SOCIAL */}
            <div className={styles.gridCell}>
              <div className={styles.socialCell}>
                <a href="#" className={styles.socialLink} aria-label="Instagram (set URL in Footer.jsx)">
                  INSTAGRAM
                </a>
                <a href="#" className={styles.socialLink} aria-label="LinkedIn (set URL in Footer.jsx)">
                  LINKEDIN
                </a>
                <a href="#" className={styles.socialLink} aria-label="YouTube (set URL in Footer.jsx)">
                  YOUTUBE
                </a>
              </div>
            </div>

            {/* CAREER */}
            <div className={styles.gridCell}>
              <div className={styles.contactCell}>
                <p className={styles.cellLabel}>GOT TALENT?</p>
                <a
                  href="mailto:career@example.com"
                  className={styles.cellEmail}
                >
                  CAREER@EXAMPLE.COM
                </a>
                 
               <div className={styles.contactCell}>
              <p className={styles.cellLabel}>GET IN TOUCH</p>
              <a
                href="mailto:hello@example.com"
                className={styles.cellEmail}
              >
                HELLO@EXAMPLE.COM
              </a>
            </div>
              </div>
            </div>
           
           
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className={styles.footerBottom}>
        <div className={styles.bottomContent}>
          <div className={styles.bottonContentFirst}>
            <p>Copyright 2026 All Rights Reserved</p>
            <Link to="/privacy-policy" className={styles.bottomLink}>
              Privacy Policy
            </Link>
            <p>Powerd by <a href="mailto:info@addon-it.com" className={styles.bottomLink}>ADDON IT SOLUTIONS</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}; 

export default Footer;
