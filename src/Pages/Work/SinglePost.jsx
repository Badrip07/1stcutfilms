import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/footer/Footer";
import styles from "./SinglePost.module.css";
import { workData as staticWorkData } from "./workData";
import { useWorkData } from "../../hooks/useWorkData.js";

// Simple cache for Vimeo thumbnails on this page
const vimeoThumbCache = new Map();

// Extract numeric Vimeo ID from URLs like https://vimeo.com/123456789 or https://vimeo.com/channels/staffpicks/123456789
const getVimeoIdFromUrl = (url = "") => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^\d+$/.test(last)) return last;
    return null;
  } catch {
    return null;
  }
};

const VimeoThumbnail = ({ vimeoUrl, alt, className, style }) => {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!vimeoUrl) {
      setSrc("");
      return;
    }

    if (vimeoThumbCache.has(vimeoUrl)) {
      setSrc(vimeoThumbCache.get(vimeoUrl));
      return;
    }

    let cancelled = false;

    const fetchThumb = async () => {
      try {
        // Ask Vimeo for a wider thumbnail (up to 1920px)
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
          vimeoUrl
        )}&width=1920`;
        const res = await fetch(oembedUrl);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.thumbnail_url) {
          // Try to upgrade to a higher resolution thumbnail when Vimeo uses ..._XXX.jpg pattern
          let high = data.thumbnail_url;
          const match = high.match(/(.+)_\d+x\d+(\.\w+)$/);
          if (match) {
            high = `${match[1]}_1920${match[2]}`;
          }
          vimeoThumbCache.set(vimeoUrl, high);
          setSrc(high);
        }
      } catch {
        // Ignore errors – if Vimeo fails we just won't show a thumbnail
      }
    };

    fetchThumb();

    return () => {
      cancelled = true;
    };
  }, [vimeoUrl]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
    />
  );
};

// Warm up Vimeo connections for the single post page as well
const useVimeoPreconnect = () => {
  useEffect(() => {
    const existing = document.querySelectorAll('link[data-vimeo-preconnect="true"]');
    if (existing.length) return;

    const origins = [
      "https://player.vimeo.com",
      "https://i.vimeocdn.com",
      "https://f.vimeocdn.com",
    ];

    const links = origins.map((href) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      link.setAttribute("data-vimeo-preconnect", "true");
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
      return link;
    });

    return () => {
      links.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, []);
};

const SinglePost = ({ videoMode = "vimeo", baseRoute = "/work" } = {}) => {
  const { workData: remoteWorkData } = useWorkData();
  const workData = remoteWorkData ?? staticWorkData;

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Initialize from location.state if available to avoid initial flicker
  const [post, setPost] = useState(() => location.state?.post || null);
  const [isPageReady, setIsPageReady] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [playingContentIndex, setPlayingContentIndex] = useState(null);
  const videoRef = useRef(null);
  const contentVideoRefs = useRef({});

  // Refs for campaign stills line-drawing animation
  const campaignStillsSectionRef = useRef(null);
  const stillsLine1Ref = useRef(null);
  const stillsLine2Ref = useRef(null);
  const campaignFilmSectionRef = useRef(null);
  const someContentSectionRef = useRef(null);

  // Warm up Vimeo connections here too
  useVimeoPreconnect();

  // Heading line draw on scroll: CAMPAIGN FILM, CAMPAIGN STILLS, SOME CONTENT
  // Run when content is mounted (isPageReady) so refs are in the DOM
  useEffect(() => {
    if (!post || !isPageReady) return;

    gsap.registerPlugin(ScrollTrigger);
    const sections = [
      campaignFilmSectionRef.current,
      campaignStillsSectionRef.current,
      someContentSectionRef.current,
    ].filter(Boolean);

    const triggers = sections.map((section) =>
      ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        onEnter: () => section.classList.add(styles.singlePostLineInView),
        onLeaveBack: () => section.classList.remove(styles.singlePostLineInView),
      })
    );

    ScrollTrigger.refresh();

    return () => triggers.forEach((t) => t.kill());
  }, [post, isPageReady]);

  // Hover-to-play handlers for "SOME CONTENT" videos
  const handleContentMouseEnter = (index, hasInlineVideo) => {
    setPlayingContentIndex(index);
    if (hasInlineVideo) {
      const video = contentVideoRefs.current[index];
      if (video) {
        video.currentTime = 0;
        video.muted = true;
        video.play().catch(() => {
          // Ignore autoplay restrictions
        });
      }
    }
  };

  const handleContentMouseLeave = (index, hasInlineVideo) => {
    if (hasInlineVideo) {
      const video = contentVideoRefs.current[index];
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
    setPlayingContentIndex(null);
  };

  // Scroll to top when opening or changing single post (avoid footer flash)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  // Resolve post from router state and/or GET /api/public/work (same shape as workData.js)
  useEffect(() => {
    setIsPageReady(false);
    const idIsUid = typeof id === "string" && id.includes(":");
    const idNum = !idIsUid ? parseInt(id, 10) : null;

    const allPosts = [
      ...((workData.video || []).map((p) => ({ ...p, uid: `video:${p.id}` }))),
      ...((workData.photography || []).map((p) => ({ ...p, uid: `photography:${p.id}` }))),
      ...((workData["3d"] || []).map((p) => ({ ...p, uid: `3d:${p.id}` }))),
      ...((workData.ai || []).map((p) => ({ ...p, uid: `ai:${p.id}` }))),
    ];

    const foundPost = allPosts.find((p) =>
      idIsUid ? p.uid === id : p.id === idNum
    );

    const statePost = location.state?.post;
    if (statePost) {
      setPost(foundPost ? { ...statePost, ...foundPost } : statePost);
      return;
    }

    if (foundPost) setPost(foundPost);
    else navigate(baseRoute);
  }, [id, navigate, baseRoute, workData, location.state?.post]);

  // After post is set, show loader for 0.5s then reveal page (no footer-first flash)
  useEffect(() => {
    if (!post) return;
    const t = setTimeout(() => setIsPageReady(true), 500);
    return () => clearTimeout(t);
  }, [post, id]);

  // Scroll-triggered fade-up animations + line drawing (run when content is mounted after loader)
  useEffect(() => {
    if (!post || !isPageReady) return;

    gsap.registerPlugin(ScrollTrigger);

    const elements = document.querySelectorAll('[data-animate="fade-up"]');

    const viewportH = window.innerHeight;
    const animations = Array.from(elements).map((el) => {
      const alreadyInView = el.getBoundingClientRect().top < viewportH * 0.9;
      if (alreadyInView) {
        return gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
      }
      return gsap.fromTo(
        el,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 40%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    // Line drawing animation for Campaign Stills section (grows with scroll)
    // Use setTimeout to ensure DOM is fully rendered
    let lineAnimationTimeout;
    const setupLineAnimation = () => {
      if (
        campaignStillsSectionRef.current &&
        stillsLine1Ref.current &&
        stillsLine2Ref.current
      ) {
        // Ensure lines are visible (opacity) even when scaled to 0
        gsap.set([stillsLine1Ref.current, stillsLine2Ref.current], {
          opacity: 1,
          scaleY: 0,
        });

        const lineTimeline = gsap.fromTo(
          [stillsLine1Ref.current, stillsLine2Ref.current],
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            stagger: 0.15,
            scrollTrigger: {
              trigger: campaignStillsSectionRef.current,
              start: "top bottom", // start when section enters viewport
              end: "bottom top",   // finish when section leaves viewport
              scrub: true,         // tie progress directly to scroll
            },
          }
        );

        animations.push(lineTimeline);
      }
    };

    // Try immediately, then with a delay if needed
    setupLineAnimation();
    lineAnimationTimeout = setTimeout(setupLineAnimation, 100);

    return () => {
      clearTimeout(lineAnimationTimeout);
      animations.forEach((anim) => anim.kill());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [post, isPageReady]);

  if (!post) {
    return (
      <div className={styles.singlePostPage}>
        <Navbar />
        <div className={styles.singleLoaderOverlay}>
          <div className={styles.singleLoader}></div>
        </div>
      </div>
    );
  }

  // Show loader for 0.5s after post is set, then reveal page (avoid footer-first flash)
  if (!isPageReady) {
    return (
      <div className={styles.singlePostPage}>
        <Navbar />
        <div className={styles.singleLoaderOverlay}>
          <div className={styles.singleLoader}></div>
        </div>
      </div>
    );
  }

  const bunnyMainUrl =
    post.bunnyUrl || post.bunnyPlaybackUrl || post.bunnyVideoUrl || null;
  const isVideo =
    post.video !== undefined || post.vimeoUrl !== undefined || bunnyMainUrl !== null;
  const category = location.state?.category || "video";

  // Resolve main campaign film Vimeo URL (or fallback to direct video src)
  const rawMainVideo = post.video;
  const mainVimeoUrl =
    post.vimeoUrl ||
    (typeof rawMainVideo === "string" && rawMainVideo.includes("vimeo.com")
      ? rawMainVideo
      : null);
  const mainVimeoId = mainVimeoUrl ? getVimeoIdFromUrl(mainVimeoUrl) : null;

  return (
    <div className={styles.singlePostPage}>
      <Navbar />
      
      <div className={styles.singlePostContainer}>
        <button 
          className={styles.backButton} 
          onClick={() => navigate(baseRoute)}
          data-animate="fade-up"
        >
          ← Back to Work
        </button>

        <div className={styles.postContent}>
          {/* Video Post - Special Design */}
          {isVideo && category === "video" ? (
            <div className={styles.videoPostWrapper}>
              {/* Campaign Introduction Section */}
              
              
              <div className={styles.campaignIntro}>
                <div className={styles.branding} data-animate="fade-up">
                  <span className={styles.brandText}>PRITESH PHOTOGRAPHY</span>
                  <img src="/cross.png" alt="×" className={styles.brandX} />
                  <img 
                    src={post.brandImage || `/${post.title.toLowerCase()}.png`} 
                    alt={post.title} 
                    className={styles.brandImage}
                  />
                </div>
                
                <h1 className={styles.campaignTitle} data-animate="fade-up">{post.title}</h1>
                <p className={styles.campaignSubtitle} data-animate="fade-up">{post.subtitle}</p>
                
                <div className={styles.campaignDescription}>
                  <p data-animate="fade-up">{post.content || "We are a creative studio focused on photography and film. We love sharp ideas, honest craft, and work that earns attention for the right reasons."}</p>
                </div>
              </div>

             

              {/* Campaign Film Section */}
              <div ref={campaignFilmSectionRef} className={styles.campaignFilmSection} data-animate="fade-up">
              <div className={styles.caseHeader}>
                <div className={styles.caseLineLeft}></div>
                <h2 className={styles.caseTitle}>
                  CAMPAIGN <span className={styles.caseTitleHighlight}>FILM</span>
                </h2>
              </div>
                <div className={styles.videoPlayerWrapper}>

                  {!isVideoPlaying ? (
                    <div className={styles.videoThumbnailContainer}>
                      {mainVimeoUrl ? (
                        <VimeoThumbnail
                          vimeoUrl={mainVimeoUrl}
                          alt={post.title}
                          className={styles.videoThumbnail}
                        />
                      ) : post.thumbnail ? (
                        <img src={post.thumbnail} alt={post.title} className={styles.videoThumbnail} />
                      ) : null}
                      {/* If Vimeo thumbnail is missing, Bunny can still play on click */}
                      <button 
                        className={styles.videoPlayButton} 
                        onClick={() => {
                          setIsVideoPlaying(true);
                          if (videoRef.current) {
                            videoRef.current.play().catch(() => {
                              // ignore autoplay restrictions
                            });
                          }
                        }}
                      >
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </button>
                    </div>
                  ) : null}
                  {videoMode === "bunny" && bunnyMainUrl ? (
                    <video
                      ref={videoRef}
                      src={bunnyMainUrl}
                      controls
                      playsInline
                      className={styles.mainVideo}
                      style={{ display: isVideoPlaying ? "block" : "none" }}
                    />
                  ) : mainVimeoId ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${mainVimeoId}?autoplay=1&muted=0&loop=0`}
                      className={styles.mainVideo}
                      title={post.title}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      style={{ display: isVideoPlaying ? "block" : "none" }}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={post.video}
                      controls
                      playsInline
                      className={styles.mainVideo}
                      style={{ display: isVideoPlaying ? "block" : "none" }}
                    />
                  )}
                </div>
              </div>

              {/* Campaign Stills Section */}
              {post.campaignStills && post.campaignStills.length > 0 && (
                <>
                  
                  <div
                    className={styles.campaignStillsSection}
                    data-animate="fade-up"
                    ref={campaignStillsSectionRef}
                  >
                    <div className={styles.caseHeader}>
                      <div className={styles.caseLineLeft}></div>
                      <h2 className={styles.caseTitle} data-animate="fade-up">
                        CAMPAIGN <span className={styles.caseTitleHighlight}>STILLS</span>
                      </h2>
                    </div>
                    <div
                      className={styles.SinglelineHorizontal1}
                      ref={stillsLine1Ref}
                    data-animate="fade-up" ></div>
                    <div
                      className={styles.SinglelineHorizontal2}
                      ref={stillsLine2Ref}
                    data-animate="fade-up"></div>
                    <div className={styles.stillsGrid}>
                      {post.campaignStills.map((still, index) => {
                        const src =
                          typeof still === "string"
                            ? still
                            : still?.url || still?.src || "";
                        if (!src) return null;
                        return (
                        <div 
                          key={index} 
                          className={styles.stillItem}
                          data-animate="fade-up"
                        >
                          <img src={src} alt={`${post.title} - Still ${index + 1}`} />
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Some Content Section */}
              {post.additionalContent && post.additionalContent.length > 0 && (
                <>
                  
                  <div ref={someContentSectionRef} className={styles.someContentSection} data-animate="fade-up">
                  <div className={styles.caseHeader}>
                <div className={styles.caseLineLeft}></div>
                  <h2 className={styles.caseTitle} data-animate="fade-up">
                  SOME <span className={styles.caseTitleHighlight}>CONTENT</span>
                  </h2>
                </div>
                    <div className={styles.contentGrid}>
                      {post.additionalContent.map((item, index) => (
                        <div 
                          key={index} 
                          className={styles.contentItem}
                          data-animate="fade-up"
                          onMouseEnter={() =>
                            handleContentMouseEnter(
                              index,
                              videoMode === "bunny"
                                ? Boolean(
                                    item.bunnyUrl ||
                                      item.bunnyPlaybackUrl ||
                                      item.bunnyVideoUrl
                                  ) ||
                                  !(item.vimeoUrl ||
                                    (item.video &&
                                      String(item.video).includes("vimeo.com")))
                                : !(item.vimeoUrl || (item.video && String(item.video).includes("vimeo.com")))
                            )
                          }
                          onMouseLeave={() =>
                            handleContentMouseLeave(
                              index,
                              videoMode === "bunny"
                                ? Boolean(
                                    item.bunnyUrl ||
                                      item.bunnyPlaybackUrl ||
                                      item.bunnyVideoUrl
                                  ) ||
                                  !(item.vimeoUrl ||
                                    (item.video &&
                                      String(item.video).includes("vimeo.com")))
                                : !(item.vimeoUrl || (item.video && String(item.video).includes("vimeo.com")))
                            )
                          }
                        >
                          <div className={styles.contentThumbnail}>
                            {(() => {
                              const itemVimeoUrl =
                                item.vimeoUrl ||
                                (item.video && String(item.video).includes("vimeo.com")
                                  ? item.video
                                  : null);
                              const itemVimeoId = itemVimeoUrl
                                ? getVimeoIdFromUrl(itemVimeoUrl)
                                : null;
                              const itemBunnyUrl =
                                item.bunnyUrl ||
                                item.bunnyPlaybackUrl ||
                                item.bunnyVideoUrl ||
                                null;

                              if (
                                itemVimeoUrl &&
                                itemVimeoId &&
                                !(videoMode === "bunny" && itemBunnyUrl)
                              ) {
                                return (
                                  <>
                                    <VimeoThumbnail
                                      vimeoUrl={itemVimeoUrl}
                                      alt={item.title || `${post.title} - ${index + 1}`}
                                      className={styles.videoThumbnail}
                                      style={{
                                        opacity: playingContentIndex === index ? 0 : 1,
                                      }}
                                    />
                                    {playingContentIndex === index && (
                                      <iframe
                                        src={`https://player.vimeo.com/video/${itemVimeoId}?autoplay=1&muted=1&loop=1&controls=0`}
                                        className={styles.contentVideo}
                                        title={item.title || `${post.title} - ${index + 1}`}
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        style={{ opacity: 1 }}
                                      />
                                    )}
                                  </>
                                );
                              }

                              // Fallback to original image + HTML5 video behavior
                              return (
                                <>
                                  {itemVimeoUrl && itemVimeoId ? (
                                    <VimeoThumbnail
                                      vimeoUrl={itemVimeoUrl}
                                      alt={item.title || `${post.title} - ${index + 1}`}
                                      className={styles.videoThumbnail}
                                      style={{
                                        opacity:
                                          playingContentIndex === index ? 0 : 1,
                                      }}
                                    />
                                  ) : (
                                    <img
                                      src={
                                        item.thumbnail ||
                                        item.poster ||
                                        item.src ||
                                        item.image
                                      }
                                      alt={
                                        item.title || `${post.title} - ${index + 1}`
                                      }
                                      style={{
                                        opacity:
                                          playingContentIndex === index ? 0 : 1,
                                      }}
                                    />
                                  )}
                                  <video
                                    ref={(el) => {
                                      if (el) contentVideoRefs.current[index] = el;
                                    }}
                                    src={
                                      itemBunnyUrl || item.video || item.src
                                    }
                                    muted
                                    loop
                                    playsInline
                                    className={styles.contentVideo}
                                    style={{
                                      opacity: playingContentIndex === index ? 1 : 0,
                                    }}
                                  />
                                </>
                              );
                            })()}
                            {/* Visual play icon overlay (hover to play is handled by mouse events) */}
                            <button
                              type="button"
                              className={styles.contentPlayButton}
                              aria-hidden="true"
                              tabIndex={-1}
                              style={{ opacity: playingContentIndex === index ? 0 : 1 }}
                            >
                              <svg
                                width="40"
                                height="40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Image Post - Campaign Design for Photography, 3D, AI */
            <div className={styles.imagePostWrapper}>
              {/* Campaign Introduction Section */}
              <div className={styles.campaignIntro} data-animate="fade-up">
                <div className={styles.branding}>
                  <span className={styles.brandText}>PRITESH PHOTOGRAPHY</span>
                  <img src="/cross.png" alt="×" className={styles.brandX} />
                  {post.brandImage && (
                    <img 
                      src={post.brandImage} 
                      alt={post.title} 
                      className={styles.brandImage}
                    />
                  )}
                </div>

                <h1 className={styles.campaignTitle} data-animate="fade-up">{post.title}</h1>
                <p className={styles.campaignSubtitle} data-animate="fade-up">{post.subtitle}</p>
              </div>

              {/* Gallery Grid Section */}
              {(post.campaignStills || post.gallery || post.image) && (() => {
                const rawGallery =
                  post.campaignStills || post.gallery || (post.image ? [post.image] : []);
                const galleryImages = rawGallery
                  .map((item) =>
                    typeof item === "string"
                      ? item
                      : item?.url || item?.src || item?.image || ""
                  )
                  .filter(Boolean);
                const hasMultipleImages = galleryImages.length > 1;
                const lastRowCount =
                  galleryImages.length % 3 === 0
                    ? 3
                    : galleryImages.length % 3;
                return (
                  <div
                    className={`${styles.campaignStillsSection} ${!hasMultipleImages ? styles.campaignStillsSectionSingle : ""}`}
                    data-animate="fade-up"
                    ref={campaignStillsSectionRef}
                  >
                    {hasMultipleImages && (
                      <>
                        <div
                          className={styles.SinglelineHorizontal1}
                          ref={stillsLine1Ref}
                        ></div>
                        <div
                          className={styles.SinglelineHorizontal2}
                          ref={stillsLine2Ref}
                        ></div>
                      </>
                    )}
                    <div
                      className={styles.stillsGrid}
                      style={{ "--lastRowCount": lastRowCount }}
                    >
                      {galleryImages.map((image, index) => (
                        <div 
                          key={index} 
                          className={styles.stillItem}
                          data-animate="fade-up"
                        >
                          <img src={image} alt={`${post.title} - Image ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SinglePost;

