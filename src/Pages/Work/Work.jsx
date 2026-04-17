import React, { useState, useRef, useEffect, useLayoutEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/footer/Footer";
import GlassButton from "../../Components/GlassButton/GlassButton";
import styles from "./Work.module.css";
import { workData as staticWorkData } from "./workData";
import { useWorkData } from "../../hooks/useWorkData.js";

// Cache Vimeo thumbnails so we don't refetch repeatedly
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
  const url = vimeoUrl || "";

  useEffect(() => {
    if (!url) {
      setSrc("");
      return;
    }

    if (vimeoThumbCache.has(url)) {
      setSrc(vimeoThumbCache.get(url));
      return;
    }

    let cancelled = false;

    const fetchThumb = async () => {
      try {
        // Ask Vimeo for a wider thumbnail (up to 1920px)
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
          url
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
          vimeoThumbCache.set(url, high);
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
  }, [url]);

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

const VimeoHoverVideo = () => {
  const [isHovered, setIsHovered] = useState(false);
  const vimeoId = "1172538823";
  const vimeoUrl = `https://vimeo.com/${vimeoId}`;

  return (
    <div
      className={styles.vimeoHero}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isHovered && (
        <VimeoThumbnail
          vimeoUrl={vimeoUrl}
          alt="Featured work"
          className={styles.vimeoHeroThumb}
        />
      )}
      {isHovered && (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&controls=0`}
          className={styles.vimeoHeroFrame}
          title="Featured Vimeo video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
};

const LOCAL_WORK_VIDEO_PATHS = [
  "/work-video/247a4df2-44c5c0dd.mp4",
  "/work-video/4c4d6c0f-16494b14.mp4",
  "/work-video/68ce7dfd-4c2ae82e.mp4",
  "/work-video/98d7c575-a1578499.mp4",
  "/work-video/ca6a52e2-9d8be726.mp4",
  "/work-video/d69adc86-a03cd9e4.mp4",
  "/work-video/d7caaf32-bca914e9.mp4",
  "/work-video/k1.mp4",
  "/work-video/k2.mp4",
  "/work-video/k3.mp4",
  "/work-video/k4.mp4",
  "/work-video/k5.mp4",
  "/work-video/k6.mp4",
  "/work-video/k7.mp4",
  "/work-video/v5.mp4",
  "/work-video/v6.mp4",
  "/work-video/v7.mp4",
  "/work-video/v8.mp4",
  "/work-video/v9.mp4",
  "/work-video/v10.mp4",
  "/work-video/v11.mp4",
  "/work-video/v12.mp4",
];

const Work = ({ videoMode = "vimeo", baseRoute = "/work", useLocalWorkVideos = false } = {}) => {
  const { workData: remoteWorkData } = useWorkData();
  const workData = remoteWorkData ?? staticWorkData;

  const getInitialVisibleCount = (tabId) => (tabId === "video" ? 6 : 12);
  const getLoadMoreStep = (tabId) => (tabId === "video" ? 3 : 12);

  const [activeTab, setActiveTab] = useState("video");
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(() =>
    getInitialVisibleCount("video")
  );
  const [loadedMediaMap, setLoadedMediaMap] = useState({});
  const [isInitialVideoBatchLoading, setIsInitialVideoBatchLoading] = useState(true);
  // Vimeo iframes mount only after first hover (no network load on initial page paint)
  const [vimeoIframeRequested, setVimeoIframeRequested] = useState({});
  const warmupDoneRef = useRef({});
  const navigate = useNavigate();
  
  // Refs for vertical lines
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const contentGridRef = useRef(null);
  // Refs for horizontal lines
  const horizontalLinesRef = useRef([]);
  // Keep mounted Vimeo iframes so hover can play instantly (no cold start)
  const iframeRefs = useRef({});
  // Keep mounted Bunny <video> elements so hover can play instantly (no cold start)
  const videoRefs = useRef({});
  const previousVisibleCountRef = useRef(getInitialVisibleCount("video"));
  const warmedPreviewUrlsRef = useRef(new Set());

  // Warm up connections to Vimeo so hover playback feels snappier (preconnect + preload)
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

    // Preload Vimeo player script so hovering can start playback quicker
    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "script";
    preloadLink.href = "https://player.vimeo.com/api/player.js";
    preloadLink.setAttribute("data-vimeo-preload", "true");
    preloadLink.crossOrigin = "anonymous";
    document.head.appendChild(preloadLink);

    return () => {
      links.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
      if (preloadLink.parentNode) preloadLink.parentNode.removeChild(preloadLink);
    };
  }, []);

  const tabs = [
    { id: "video", label: "VIDEO" },
    { id: "photography", label: "PHOTOGRAPHY" },
    { id: "3d_ai", label: "3D / AI" },
  ];
  const shouldUseLocalWorkVideos = useLocalWorkVideos && baseRoute === "/work-copy";

  const getResolvedBunnyUrl = (post, videoIndex = 0) => {
    const originalUrl =
      post.bunnyUrl || post.bunnyPlaybackUrl || post.bunnyVideoUrl || null;
    if (!originalUrl) return null;
    if (!shouldUseLocalWorkVideos) return originalUrl;
    if (!LOCAL_WORK_VIDEO_PATHS.length) return originalUrl;
    const normalizedIndex =
      Number.isFinite(videoIndex) && videoIndex >= 0 ? videoIndex : 0;
    return LOCAL_WORK_VIDEO_PATHS[normalizedIndex % LOCAL_WORK_VIDEO_PATHS.length];
  };

  const handleVideoHover = (post, isEntering) => {
    if (isEntering) {
      if (videoMode !== "bunny" && activeTab === "video") {
        setVimeoIframeRequested((prev) =>
          prev[post.id] ? prev : { ...prev, [post.id]: true }
        );
      }
      setPlayingVideoId(post.id);
    } else {
      setPlayingVideoId((current) => (current === post.id ? null : current));
    }
  };

  const sendVimeoCommand = (iframeEl, method) => {
    if (!iframeEl?.contentWindow) return;
    try {
      const message = JSON.stringify({ method });
      // Vimeo iframe origin
      iframeEl.contentWindow.postMessage(message, "https://player.vimeo.com");
    } catch {
      // ignore
    }
  };

  const parseVimeoMessage = (rawData) => {
    if (!rawData) return null;
    if (typeof rawData === "string") {
      try {
        return JSON.parse(rawData);
      } catch {
        return null;
      }
    }
    if (typeof rawData === "object") return rawData;
    return null;
  };

  // Play active iframe, pause all others (Vimeo API must be ready)
  useEffect(() => {
    if (videoMode === "bunny") return;

    const ids = Object.keys(iframeRefs.current);
    if (!ids.length) return;

    ids.forEach((id) => {
      const el = iframeRefs.current[id];
      if (el) sendVimeoCommand(el, "pause");
    });

    if (playingVideoId && loadedMediaMap[playingVideoId]) {
      const activeEl = iframeRefs.current[playingVideoId];
      if (activeEl) {
        window.setTimeout(() => sendVimeoCommand(activeEl, "play"), 80);
        window.setTimeout(() => sendVimeoCommand(activeEl, "play"), 320);
      }
    }
  }, [playingVideoId, loadedMediaMap, videoMode]);

  // Mark Vimeo iframes as truly ready (not just loaded) before hiding loaders
  useEffect(() => {
    if (videoMode === "bunny") return;

    const handleVimeoMessage = (event) => {
      if (event.origin !== "https://player.vimeo.com") return;
      const payload = parseVimeoMessage(event.data);
      if (!payload || payload.event !== "ready" || !payload.player_id) return;

      const postId = String(payload.player_id).replace(/^vimeo-/, "");
      if (!postId) return;

      setLoadedMediaMap((prev) => {
        if (prev[postId]) return prev;
        return { ...prev, [postId]: true };
      });

      // Warm up playback once so hover starts instantly
      if (!warmupDoneRef.current[postId]) {
        warmupDoneRef.current[postId] = true;
        const iframeEl = iframeRefs.current[postId];
        if (iframeEl) {
          window.setTimeout(() => sendVimeoCommand(iframeEl, "play"), 60);
          window.setTimeout(() => sendVimeoCommand(iframeEl, "pause"), 220);
        }
      }
    };

    window.addEventListener("message", handleVimeoMessage);
    return () => {
      window.removeEventListener("message", handleVimeoMessage);
    };
  }, [videoMode]);

  const playingRowMediaReady =
    playingVideoId != null ? !!loadedMediaMap[playingVideoId] : false;

  // Play active Bunny <video>, pause all others (layout effect + rAF retries so Load More refs exist)
  useLayoutEffect(() => {
    if (videoMode !== "bunny") return;

    const pauseAll = () => {
      Object.keys(videoRefs.current).forEach((id) => {
        const el = videoRefs.current[id];
        if (!el) return;
        el.pause();
        try {
          el.currentTime = 0;
        } catch {
          // ignore
        }
      });
    };

    pauseAll();
    if (!playingVideoId) return;

    let cancelled = false;
    let frames = 0;
    const maxFrames = 12;

    const tryPlay = () => {
      if (cancelled) return;
      const activeEl = videoRefs.current[playingVideoId];
      if (activeEl) {
        try {
          activeEl.currentTime = 0;
        } catch {
          // ignore
        }
        activeEl.play().catch(() => {
          // ignore autoplay restrictions
        });
        return;
      }
      frames += 1;
      if (frames < maxFrames) {
        requestAnimationFrame(tryPlay);
      }
    };

    tryPlay();
    return () => {
      cancelled = true;
    };
  }, [playingVideoId, videoMode, visibleCount, playingRowMediaReady]);

  const handlePostClick = (post) => {
    const routeId = post.uid ?? post.id;
    navigate(`${baseRoute}/${routeId}`, { state: { post, category: activeTab } });
  };

  // Post has only one image (no gallery/multiple stills) → no single page, no click
  const isImageOnlyPost = (post) => {
    const gallery = post.campaignStills || post.gallery || (post.image ? [post.image] : []);
    return gallery.length <= 1;
  };

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    setVisibleCount(getInitialVisibleCount(tabId));
    previousVisibleCountRef.current = getInitialVisibleCount(tabId);
    
    // Reset vertical lines clip-path so animation restarts for each tab
    if (line1Ref.current) {
      line1Ref.current.style.clipPath = "inset(0 0 100% 0)";
    }
    if (line2Ref.current) {
      line2Ref.current.style.clipPath = "inset(0 0 100% 0)";
    }

    // Reset horizontal lines (video grid) so their draw animation restarts
    horizontalLinesRef.current.forEach((lineRef) => {
      if (lineRef && lineRef.current) {
        lineRef.current.style.clipPath = "inset(0 100% 0 0)";
      }
    });
    horizontalLinesRef.current = [];
  };

  // Scroll to top on initial page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  }, []); // Run only on mount

  // Scroll to top when tab changes - use useEffect to ensure it happens after render
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: "instant", // Use instant instead of smooth for immediate scroll
        });
      });
    }
  }, [activeTab]);

  const handleLoadMore = () => {
    const step = getLoadMoreStep(activeTab);
    setVisibleCount((prev) => prev + step);
  };

  const allPosts = (() => {
    if (activeTab === "3d_ai") {
      const threeD = (workData["3d"] || []).map((p) => ({
        ...p,
        uid: `3d:${p.id}`,
      }));
      const ai = (workData["ai"] || []).map((p) => ({
        ...p,
        uid: `ai:${p.id}`,
      }));
      // Show AI items first (matches your request), then 3D
      return [...ai, ...threeD];
    }

    return workData[activeTab] || [];
  })();
  const currentPosts = allPosts.slice(0, visibleCount);
  const hasMore = allPosts.length > visibleCount;

  // Show page loader until the first 6 Bunny MP4s in the video tab can start playback.
  useEffect(() => {
    if (activeTab !== "video") {
      setIsInitialVideoBatchLoading(false);
      return;
    }

    const firstBatch = (workData.video || []).slice(0, 6);
    const previewUrls = firstBatch
      .map((post, index) => getResolvedBunnyUrl(post, index))
      .filter(Boolean);

    if (!previewUrls.length) {
      setIsInitialVideoBatchLoading(false);
      return;
    }

    let cancelled = false;
    const cleanups = [];
    const slotDone = new Set();

    const markSlotDone = (slotIndex) => {
      if (slotDone.has(slotIndex)) return;
      slotDone.add(slotIndex);
      if (!cancelled && slotDone.size >= previewUrls.length) {
        setIsInitialVideoBatchLoading(false);
      }
    };

    setIsInitialVideoBatchLoading(true);

    previewUrls.forEach((url, slotIndex) => {
      const el = document.createElement("video");
      el.preload = "auto";
      el.muted = true;
      el.playsInline = true;

      const onComplete = () => markSlotDone(slotIndex);

      el.addEventListener("canplay", onComplete, { once: true });
      el.addEventListener("error", onComplete, { once: true });
      el.src = url;
      el.load();

      cleanups.push(() => {
        el.removeEventListener("canplay", onComplete);
        el.removeEventListener("error", onComplete);
        el.src = "";
        el.load();
      });
    });

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [activeTab, shouldUseLocalWorkVideos]);

  // Proactively warm the next "Load More" row (3 videos) before user clicks.
  useEffect(() => {
    if (activeTab !== "video" || videoMode !== "bunny") return;

    const step = getLoadMoreStep("video");
    const nextPosts = (workData.video || []).slice(visibleCount, visibleCount + step);
    if (!nextPosts.length) return;

    const cleanups = [];
    nextPosts.forEach((post, offset) => {
      const absoluteIndex = visibleCount + offset;
      const url = getResolvedBunnyUrl(post, absoluteIndex);
      if (!url || warmedPreviewUrlsRef.current.has(url)) return;
      warmedPreviewUrlsRef.current.add(url);

      const el = document.createElement("video");
      el.preload = "auto";
      el.muted = true;
      el.playsInline = true;

      const onDone = () => {
        setLoadedMediaMap((prev) => {
          if (prev[post.id]) return prev;
          return { ...prev, [post.id]: true };
        });
      };

      el.addEventListener("loadeddata", onDone, { once: true });
      el.addEventListener("canplay", onDone, { once: true });
      el.addEventListener("error", onDone, { once: true });
      el.src = url;
      el.load();

      cleanups.push(() => {
        el.removeEventListener("loadeddata", onDone);
        el.removeEventListener("canplay", onDone);
        el.removeEventListener("error", onDone);
        el.src = "";
        el.load();
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [visibleCount, activeTab, videoMode, shouldUseLocalWorkVideos]);

  // Warm up the newly revealed video row after "Load More" so hover-play starts quicker.
  useEffect(() => {
    if (activeTab !== "video" || videoMode !== "bunny") {
      previousVisibleCountRef.current = visibleCount;
      return;
    }

    const previousCount = previousVisibleCountRef.current;
    if (visibleCount <= previousCount) {
      previousVisibleCountRef.current = visibleCount;
      return;
    }

    const revealedPosts = (workData.video || []).slice(previousCount, visibleCount);
    previousVisibleCountRef.current = visibleCount;
    if (!revealedPosts.length) return;

    const cleanups = [];
    revealedPosts.forEach((post, offset) => {
      const url = getResolvedBunnyUrl(post, previousCount + offset);
      if (!url) return;

      const el = document.createElement("video");
      el.preload = "auto";
      el.muted = true;
      el.playsInline = true;

      const markReady = () => {
        setLoadedMediaMap((prev) => {
          if (prev[post.id]) return prev;
          return { ...prev, [post.id]: true };
        });
      };

      el.addEventListener("loadeddata", markReady, { once: true });
      el.addEventListener("canplay", markReady, { once: true });
      el.addEventListener("error", markReady, { once: true });
      el.src = url;
      el.load();

      cleanups.push(() => {
        el.removeEventListener("loadeddata", markReady);
        el.removeEventListener("canplay", markReady);
        el.removeEventListener("error", markReady);
        el.src = "";
        el.load();
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [visibleCount, activeTab, videoMode, shouldUseLocalWorkVideos]);

  const handleMediaLoaded = (postId) => {
    setLoadedMediaMap((prev) => {
      if (prev[postId]) return prev;
      return { ...prev, [postId]: true };
    });
  };

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
  }, [hasMore, visibleCount]); // Re-run when button appears/disappears or count changes

  // Scroll-based line drawing animation
  useEffect(() => {
    const handleScroll = () => {
      if (!line1Ref.current || !line2Ref.current || !contentGridRef.current) return;

      const contentGrid = contentGridRef.current;
      const rect = contentGrid.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Get absolute position in document
      const contentTop = rect.top + scrollY;
      const contentHeight = rect.height;
      const contentBottom = contentTop + contentHeight;
      
      // SPEED FACTOR: Higher value = faster drawing, lower value = slower
      const speedFactor = 2.2;
      
      // Lines start drawing when content grid enters viewport
      // Calculate progress: 0 = content top at viewport bottom, 1 = content bottom at viewport top
      let scrollProgress = 0;
      
      // When content grid top reaches bottom of viewport, start drawing.
      // Use Math.max(0, ...) so that at the very top of the page (scrollY = 0)
      // the lines are fully hidden and only start drawing as you scroll down.
      const triggerPoint = Math.max(0, contentTop - windowHeight);
      // Reduce the completion distance for faster drawing, relative to trigger
      const completionPoint = triggerPoint + (contentHeight / speedFactor);
      
      if (scrollY >= triggerPoint && scrollY <= completionPoint) {
        // We're in the drawing range
        const distanceScrolled = scrollY - triggerPoint;
        const totalDrawingDistance = completionPoint - triggerPoint;
        scrollProgress = Math.min(1, Math.max(0, distanceScrolled / totalDrawingDistance));
      } else if (scrollY > completionPoint) {
        // Fully scrolled past - lines should be fully visible
        scrollProgress = 1;
      }
      
      // Apply clip-path to create drawing effect from top to bottom
      // clip-path: inset() - hide from bottom, revealing from top
      const clipBottom = 100 - (scrollProgress * 100);
      
      line1Ref.current.style.clipPath = `inset(0 0 ${Math.max(0, Math.min(100, clipBottom))}% 0)`;
      line2Ref.current.style.clipPath = `inset(0 0 ${Math.max(0, Math.min(100, clipBottom))}% 0)`;
      
      // Animate horizontal lines - draw from left to right
      horizontalLinesRef.current.forEach((lineRef, index) => {
        if (lineRef && lineRef.current) {
          const lineRect = lineRef.current.getBoundingClientRect();
          const lineTop = lineRect.top + scrollY;
          const lineBottom = lineTop + lineRect.height;
          
          // Calculate progress for each horizontal line individually
          let lineProgress = 0;
          const lineTriggerPoint = Math.max(0, lineTop - windowHeight);
          const lineCompletionPoint = lineTriggerPoint + (windowHeight * 0.9); // Even slower, smoother completion
          
          if (scrollY >= lineTriggerPoint && scrollY <= lineCompletionPoint) {
            const lineDistanceScrolled = scrollY - lineTriggerPoint;
            const lineTotalDistance = lineCompletionPoint - lineTriggerPoint;
            lineProgress = Math.min(1, Math.max(0, lineDistanceScrolled / lineTotalDistance));
          } else if (scrollY > lineCompletionPoint) {
            lineProgress = 1;
          }
          
          // Draw horizontal line from left to right using clip-path
          const clipRight = 100 - (lineProgress * 100);
          lineRef.current.style.clipPath = `inset(0 ${Math.max(0, Math.min(100, clipRight))}% 0 0)`;
        }
      });
    };

    // Initial call with small delay to ensure DOM is ready
    const initTimer = setTimeout(handleScroll, 100);
    
    // Optimized scroll handler with requestAnimationFrame for smooth performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [visibleCount, activeTab, currentPosts.length]); // Re-run when content changes

  return (
    <div className={styles.workPage}>
      <Navbar />
      <div className={styles.workWrapper}>

      <div className={styles.workContainer}>
        {/* Tabs Navigation */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsGrid}>
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`${styles.tabColumn} ${
                  activeTab === tab.id ? styles.tabColumnActive : ""
                }`}
              >
                <button
                  className={`${styles.tabButton} ${
                    activeTab === tab.id ? styles.tabButtonActive : ""
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </button>
                {tabs.indexOf(tab) < tabs.length - 1 && (
                  <div className={styles.tabDivider}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className={styles.contentGrid} ref={contentGridRef}>
          <div className={styles.lineVertical1} ref={line1Ref}></div>
          <div className={styles.lineVertical2} ref={line2Ref}></div>
          {activeTab === "video" ? (
            // Video Tab - Grid Layout using Vimeo (thumbnail + hover autoplay)
            <div key={activeTab} className={`${styles.videoGrid} ${styles.fadeUp}`}>
              {currentPosts.map((post, index) => {
                const isEndOfRow = (index + 1) % 3 === 0;
                const horizontalLineIndex = Math.floor(index / 3);

                // Initialize refs array if needed
                if (!horizontalLinesRef.current[horizontalLineIndex]) {
                  horizontalLinesRef.current[horizontalLineIndex] = React.createRef();
                }

                // Use per-post Vimeo URL in formats like https://vimeo.com/123456789
                const vimeoUrl = post.vimeoUrl || null;
                const vimeoId = vimeoUrl ? getVimeoIdFromUrl(vimeoUrl) : null;
                // Bunny URLs are expected to be direct MP4 playback URLs
                const bunnyUrl = getResolvedBunnyUrl(post, index);

                const mediaReady = !!loadedMediaMap[post.id];
                const isPlaying = playingVideoId === post.id;
                const hideThumb = isPlaying && mediaReady;

                return (
                  <Fragment key={post.id}>
                    <div
                      className={styles.videoPost}
                      onClick={() => handlePostClick(post)}
                      onMouseEnter={() => handleVideoHover(post, true)}
                      onMouseLeave={() => handleVideoHover(post, false)}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className={styles.videoPostThumbnail}>
                        {vimeoId && vimeoUrl && (
                          <VimeoThumbnail
                            vimeoUrl={vimeoUrl}
                            alt={post.title}
                            className={styles.videoThumb}
                            style={{ opacity: hideThumb ? 0 : 1 }}
                          />
                        )}

                        {videoMode === "bunny" && bunnyUrl ? (
                          <video
                            ref={(el) => {
                              if (el) videoRefs.current[post.id] = el;
                              else delete videoRefs.current[post.id];
                            }}
                            src={bunnyUrl}
                            muted
                            loop
                            playsInline
                            preload="auto"
                            className={styles.videoPlayer}
                            title={post.title}
                            allow="autoplay; fullscreen; picture-in-picture"
                            onLoadedData={() => handleMediaLoaded(post.id)}
                            style={{
                              opacity: isPlaying && mediaReady ? 1 : 0,
                              visibility:
                                isPlaying && mediaReady ? "visible" : "hidden",
                              pointerEvents: isPlaying ? "auto" : "none",
                            }}
                          />
                        ) : vimeoId &&
                          vimeoUrl &&
                          vimeoIframeRequested[post.id] ? (
                          <iframe
                            loading="eager"
                            ref={(el) => {
                              if (el) iframeRefs.current[post.id] = el;
                              else delete iframeRefs.current[post.id];
                            }}
                            src={`https://player.vimeo.com/video/${vimeoId}?api=1&player_id=${encodeURIComponent(
                              `vimeo-${post.id}`
                            )}&autoplay=0&muted=1&loop=1&background=1&controls=0`}
                            id={`vimeo-${post.id}`}
                            className={styles.videoPlayer}
                            title={post.title}
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            style={{
                              opacity: isPlaying && mediaReady ? 1 : 0,
                              pointerEvents: isPlaying ? "auto" : "none",
                            }}
                          />
                        ) : null}
                        {post.category && (
                          <span className={styles.videoCategory}>{post.category}</span>
                        )}
                      </div>
                      <div className={styles.videoPostContent}>
                        <h3
                          className={styles.videoPostTitle}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostClick(post);
                          }}
                        >
                          {post.title}
                        </h3>
                        <p className={styles.videoPostSubtitle}>{post.subtitle}</p>
                      </div>
                    </div>
                    {isEndOfRow && index < currentPosts.length - 1 && (
                      <div
                        className={styles.videoGridLine}
                        ref={horizontalLinesRef.current[horizontalLineIndex]}
                      ></div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          ) : (
            // Photography, 3D, AI Tabs - Masonry Layout, each "load more" batch in its own row
            <div key={activeTab} className={styles.masonryRows}>
              {(() => {
                const BATCH_SIZE = 12;
                const batches = [];
                for (let i = 0; i < currentPosts.length; i += BATCH_SIZE) {
                  batches.push(currentPosts.slice(i, i + BATCH_SIZE));
                }
                return batches.map((batch, batchIndex) => (
                  <div key={`batch-${batchIndex}`} className={`${styles.masonryGrid} ${styles.fadeUp}`}>
                    {batch.map((post, index) => {
                      const imageOnly = isImageOnlyPost(post);
                      return (
                      <div
                        key={post.uid ?? post.id}
                        className={`${styles.masonryItem} ${imageOnly ? styles.masonryItemNoClick : ""}`}
                        onClick={imageOnly ? undefined : () => handlePostClick(post)}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        role={imageOnly ? undefined : "button"}
                        tabIndex={imageOnly ? -1 : 0}
                        onKeyDown={imageOnly ? undefined : (e) => e.key === "Enter" && handlePostClick(post)}
                      >
                        <div className={styles.masonryImageWrapper}>
                          <img src={post.image} alt={post.title} />
                        </div>
                        <div className={styles.masonryContent}>
                          <h3 className={styles.masonryTitle}>{post.title}</h3>
                          <p className={styles.masonrySubtitle}>{post.subtitle}</p>
                        </div>
                      </div>
                    );})}
                  </div>
                ));
              })()}
            </div>
          )}
           
          {/* Load More Button */}
          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <GlassButton
                label="LOAD MORE"
                onClick={handleLoadMore}
              />
            </div>
          )}
        </div>
      </div>
    </div>
      <Footer />
      {activeTab === "video" && isInitialVideoBatchLoading && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loader}></div>
        </div>
      )}
    </div>
  );
};

export default Work;

