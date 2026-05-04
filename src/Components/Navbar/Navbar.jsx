// Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // derive initial active from current path/hash
  const getInitialActive = () => {
    if (location.pathname === "/about") return "about";
    if (location.pathname === "/career") return "career";
    if (location.pathname === "/contact") return "contact";
    if (
      location.pathname === "/work" ||
      location.pathname.startsWith("/work/")
    )
      return "work";
    if (location.hash === "#work") return "work";
    if (location.hash === "#contact") return "contact";
    return "home";
  };

  const [active, setActive] = useState(getInitialActive);

  // keep active in sync when route/hash changes (e.g. via browser back/forward)
  useEffect(() => {
    setActive(getInitialActive());
    setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pages = [
    { id: "work", label: "WORK", path: "/work" },
    { id: "about", label: "ABOUT", path: "/about" },
    { id: "career", label: "CAREER", path: "/career" },
    { id: "contact", label: "CONTACT", path: "/contact" },
  ];

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <div className={styles.navContent}>
        <div className={styles.navLinksWrapper}>
          {/* LEFT SECTION */}
          <div className={styles.leftSection}>
            <div className={styles.leftLine}></div>
            <Link
              to="/"
              className={
                active === "home" ? styles.activeLink : styles.navLink
              }
              onClick={() => setActive("home")}
            >
              <div className={styles.heroOverlay}>
                  <img
                    src="/1st-cut-logo.png"
                    alt=""
                    className={styles.heroBadgeStrip}
                  />
              </div>
            </Link>
            <div className={styles.centerLine}></div>
          </div>

          {/* RIGHT SECTION */}
          <div className={styles.rightSection}>
            <button
              type="button"
              className={styles.menuButton}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span
                className={`${styles.menuIcon} ${
                  menuOpen ? styles.menuIconOpen : ""
                }`}
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </span>
            </button>

            <div className={styles.desktopLinks}>
            {pages.map((page) => {
              const isActive = active === page.id;

              if (page.path) {
                return (
                  <Link
                    key={page.id}
                    to={page.path}
                    className={isActive ? styles.activeLink : styles.navLink}
                    onClick={() => setActive(page.id)}
                  >
                    {page.label}
                  </Link>
                );
              }

              return (
                <a
                  key={page.id}
                  href={`/#${page.id}`}
                  className={isActive ? styles.activeLink : styles.navLink}
                  onClick={() => setActive(page.id)}
                >
                  {page.label}
                </a>
              );
            })}

            <div className={styles.rightLine1}></div>

            <div className={styles.logoContainer}>
              <img
                src="/navbarlogo.png"
                alt="1stcutfilms"
                className={styles.logoImg}
              />
            </div>

            <div className={styles.rightLine}></div>
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className={styles.mobileMenuBackdrop}
          role="presentation"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className={styles.mobileMenu}
            role="dialog"
            aria-label="Site menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mobileMenuHeader}>
              <div className={styles.mobileBrand}>1STCUTFILMS</div>
              <button
                type="button"
                className={styles.mobileClose}
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            {pages.map((page) => {
              const isActive = active === page.id;
              return (
                <Link
                  key={page.id}
                  to={page.path}
                  className={isActive ? styles.mobileLinkActive : styles.mobileLink}
                  onClick={() => {
                    setActive(page.id);
                    setMenuOpen(false);
                  }}
                >
                  {page.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
