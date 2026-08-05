const normalizedMotionPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isAnimatedHomepage = normalizedMotionPath === "/";

window.SITE_NO_MOTION = !isAnimatedHomepage;
document.documentElement.dataset.motion = isAnimatedHomepage ? "on" : "off";

if (!isAnimatedHomepage) {
  document.documentElement.classList.add("no-motion-site");

  window.freezeNoMotionMedia = function freezeNoMotionMedia(root = document) {
    root.querySelectorAll("video").forEach((video) => {
      video.autoplay = false;
      video.loop = false;
      video.removeAttribute("autoplay");
      video.removeAttribute("loop");
      video.pause();
      try {
        video.currentTime = 0;
      } catch (_) {
        // A remote video may not have metadata yet; the poster remains visible.
      }
    });
  };

  const noMotionObserver = new MutationObserver(() => window.freezeNoMotionMedia());
  noMotionObserver.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => window.freezeNoMotionMedia());
}
