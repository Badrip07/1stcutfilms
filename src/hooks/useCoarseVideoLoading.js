import { useEffect, useState } from "react";

/** iPhone / iPad (incl. iPadOS desktop UA). */
export function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Use lighter video/embed behaviour (posters, tap-to-play, no hero autoplay)
 * on iOS and narrow viewports to avoid Safari tab crashes from memory pressure.
 */
export function useCoarseVideoLoading() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => {
      const narrow = mq.matches;
      const saveData =
        typeof navigator !== "undefined" &&
        navigator.connection?.saveData === true;
      setCoarse(isIOSDevice() || narrow || saveData);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return coarse;
}
