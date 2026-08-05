window.SITE_NO_MOTION = true;
document.documentElement.classList.add("no-motion-site");
document.documentElement.dataset.motion = "off";

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
