/**
 * shdw_bio - Optimized JavaScript
 * Focuses on high-performance animations, layout caching to prevent reflows,
 * and efficient DOM updates.
 */

// Configuration
const avatarImages = [
  "avatars/photo_2025-12-26_21-41-20.jpg",
  "avatars/photo_2025-12-26_21-41-27.jpg",
  "avatars/photo_2025-12-26_21-41-36.jpg",
  "avatars/photo_2025-12-26_21-41-43.jpg",
  "avatars/photo_2025-12-26_21-41-50.jpg",
  "avatars/photo_2025-12-26_21-41-56.jpg",
  "avatars/photo_2025-12-26_21-42-05.jpg",
  "avatars/photo_2025-12-26_21-42-13.jpg",
  "avatars/photo_2025-12-26_21-42-20.jpg",
  "avatars/photo_2025-12-26_21-43-08.jpg",
  "avatars/photo_2025-12-26_21-43-23.jpg",
  "avatars/photo_2025-12-26_21-43-32.jpg",
  "avatars/photo_2025-12-26_21-43-46.jpg",
  "avatars/photo_2025-12-26_21-43-59.jpg",
  "avatars/photo_2025-12-26_21-44-04.jpg",
  "avatars/photo_2025-12-26_21-44-33.jpg",
  "avatars/photo_2025-12-26_21-44-38.jpg",
  "avatars/photo_2025-12-26_21-44-46.jpg",
  "avatars/photo_2025-12-26_21-44-52.jpg"
];
const AVATAR_CHANGE_INTERVAL = 1500;
let currentAvatarIndex = 0;
let avatarInterval = null;

const videoSources = ["edit1.mp4", "edit2.mp4", "edit3.mp4"];
let currentVideoIndex = 0;

// Delta Force ID Config
const DELTA_FORCE_ID = "27544840130911559978";

// DOM Elements
const entryScreen = document.getElementById("entry-screen");
const mainContent = document.getElementById("main-content");
const bgVideo = document.getElementById("bg-video");
const avatar = document.getElementById("avatar");
const deltaForceBtn = document.getElementById("delta-force-btn");
const copyNotification = document.getElementById("copy-notification");
const videoFade = document.getElementById("video-fade");

const redirectModal = document.getElementById("redirect-modal");
const successModal = document.getElementById("success-modal");
const bioCard = document.querySelector(".bio-card");
const redirectIconContainer = document.getElementById("redirect-icon-container");
const redirectText = document.getElementById("redirect-text");
const progressFill = document.getElementById("progress-fill");
const progressPercentage = document.getElementById("progress-percentage");
const socialLinks = document.querySelectorAll(".social-link:not(.delta-force)");

const friendsBtn = document.getElementById("friends-btn");
const friendsOrbit = document.getElementById("friends-orbit");
const friendsConnections = document.getElementById("friends-connections");
const friendAvatars = document.querySelectorAll(".friend-avatar");

// Friends Orbit configuration
let friendsVisible = false;
let orbitAnimationFrame = null;
let currentOrbitAngle = 0;
let glowTimeout = null;

const ORBIT_RADIUS = 320;
const ORBIT_SPEED = 0.0004; // radians per frame
const friendPositions = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

// SVG Connection line elements (pre-created to avoid innerHTML thrashing)
let connectionLines = [];
let outerLines = [];

// Layout cache to eliminate getBoundingClientRect layout thrashing
let layoutCache = {
  centerX: 0,
  centerY: 0,
  orbitLeft: 0,
  orbitTop: 0,
  avatarWidth: 130,
  avatarHeight: 130,
  avatarCenterX: 0,
  avatarCenterY: 0
};

/**
 * Preload avatar rotation images to prevent flickering when transitioning
 */
function preloadImages() {
  avatarImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

/**
 * Handle avatar image slideshow rotation
 */
function startAvatarRotation() {
  if (avatarInterval) clearInterval(avatarInterval);
  avatarInterval = setInterval(() => {
    avatar.classList.add("changing");
    setTimeout(() => {
      currentAvatarIndex = (currentAvatarIndex + 1) % avatarImages.length;
      avatar.src = avatarImages[currentAvatarIndex];
      avatar.classList.remove("changing");
    }, 150);
  }, AVATAR_CHANGE_INTERVAL);
}

function stopAvatarRotation() {
  if (avatarInterval) {
    clearInterval(avatarInterval);
    avatarInterval = null;
  }
}

/**
 * Cache visual layout dimensions.
 * Runs on resize to prevent calling getBoundingClientRect in requestAnimationFrame loop.
 */
function updateLayoutCache() {
  if (!mainContent.classList.contains("visible")) return;

  const cardRect = bioCard.getBoundingClientRect();
  layoutCache.centerX = cardRect.left + cardRect.width / 2;
  layoutCache.centerY = cardRect.top + cardRect.height / 2;

  const orbitRect = friendsOrbit.getBoundingClientRect();
  layoutCache.orbitLeft = orbitRect.left;
  layoutCache.orbitTop = orbitRect.top;

  const avatarRect = avatar.getBoundingClientRect();
  layoutCache.avatarWidth = avatarRect.width;
  layoutCache.avatarHeight = avatarRect.height;
  layoutCache.avatarCenterX = avatarRect.left + avatarRect.width / 2;
  layoutCache.avatarCenterY = avatarRect.top + avatarRect.height / 2;

  // Redraw connections immediately with new cache
  if (friendsVisible) {
    positionFriends(currentOrbitAngle);
  }
}

/**
 * Pre-create SVG lines once when the page loads to avoid DOM recreation in the animation loop
 */
function initSvgLines() {
  friendsConnections.innerHTML = "";
  connectionLines = [];
  outerLines = [];

  // Create 4 outer polygon lines connecting friend to friend
  for (let i = 0; i < 4; i++) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    friendsConnections.appendChild(line);
    outerLines.push(line);
  }

  // Create 4 connector lines from the avatar center to each friend
  for (let i = 0; i < 4; i++) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add("center-line");
    friendsConnections.appendChild(line);
    connectionLines.push(line);
  }
}

/**
 * Video background handlers
 */
function setupVideoLoop() {
  bgVideo.addEventListener("ended", () => {
    transitionToNextVideo();
  });
}

function transitionToNextVideo() {
  videoFade.classList.add("active");
  setTimeout(() => {
    currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
    bgVideo.src = videoSources[currentVideoIndex];
    bgVideo.play().catch(err => {
      console.warn("Video transition failed:", err);
      // Fail state handles gracefully via CSS backdrop
    });
    setTimeout(() => {
      videoFade.classList.remove("active");
    }, 500);
  }, 500);
}

function playVideo() {
  bgVideo.muted = false;
  bgVideo.volume = 1;
  bgVideo.play().catch(e => {
    console.log("Video play error (trying muted):", e);
    bgVideo.muted = true;
    bgVideo.play().catch(err => {
      console.warn("Muted play failed. Showing liquid fallback.", err);
      document.body.classList.add("video-failed");
    });
  });
}

/**
 * Entry click handler to reveal the site and start loops
 */
function handleEntryClick() {
  entryScreen.classList.add("hidden");
  setTimeout(() => {
    mainContent.classList.add("visible");
    updateLayoutCache(); // Initial cache load now that card is visible
    startAllSnow();
  }, 300);
  playVideo();
  startAvatarRotation();
}

/**
 * Safe canvas snow controller that only animates active canvases to save CPU
 */
class SnowEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.snowflakes = [];
    this.maxSnowflakes = 45;
    this.isRunning = false;
    this.animationFrameId = null;

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.width = this.canvas.parentElement.offsetWidth;
      this.canvas.height = this.canvas.parentElement.offsetHeight;
    }
  }

  createSnowflake() {
    return {
      x: Math.random() * this.canvas.width,
      y: -5,
      radius: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.8 + 0.3,
      opacity: Math.random() * 0.5 + 0.2,
      swing: Math.random() * 2 - 1,
      swingSpeed: Math.random() * 0.02 + 0.01
    };
  }

  update() {
    if (this.snowflakes.length < this.maxSnowflakes && Math.random() > 0.9) {
      this.snowflakes.push(this.createSnowflake());
    }

    for (let i = this.snowflakes.length - 1; i >= 0; i--) {
      const f = this.snowflakes[i];
      f.y += f.speed;
      f.x += Math.sin(f.y * f.swingSpeed) * f.swing * 0.3;

      if (f.y > this.canvas.height + 5) {
        this.snowflakes.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.snowflakes.length; i++) {
      const f = this.snowflakes[i];
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
      this.ctx.fill();
    }
  }

  animate() {
    if (!this.isRunning) return;
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Clear canvas when stopped to release canvas graphic buffer resources
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Instantiate and manage snow effects
const snowInstances = {
  main: null,
  redirect: null,
  success: null
};

function startAllSnow() {
  // Initially we only start the main card snow
  if (snowInstances.main) {
    snowInstances.main.start();
  }
}

function switchSnowEffect(activeKey) {
  Object.keys(snowInstances).forEach(key => {
    if (snowInstances[key]) {
      if (key === activeKey) {
        snowInstances[key].start();
      } else {
        snowInstances[key].stop();
      }
    }
  });
}

/**
 * Redirect Modal progress animation and state management
 */
function startRedirectFlow(url, name, svgIcon) {
  // Pause main loops
  stopOrbitAnimation();
  stopAvatarRotation();
  switchSnowEffect("redirect");

  bioCard.classList.remove("card-enter");
  bioCard.classList.add("card-exit");

  if (friendsVisible) {
    friendsOrbit.classList.add("card-exit-friends");
    friendsConnections.classList.add("card-exit-friends");
  }

  setTimeout(() => {
    redirectIconContainer.innerHTML = "";
    redirectIconContainer.appendChild(svgIcon);
    redirectText.textContent = `Перенаправляем в ${name}`;
    progressFill.style.width = "0%";
    progressPercentage.textContent = "0%";
    
    bioCard.style.display = "none";
    if (friendsVisible) {
      friendsOrbit.style.display = "none";
      friendsConnections.style.display = "none";
    }

    redirectModal.classList.remove("hidden");
    requestAnimationFrame(() => animateProgress(url));
  }, 500);
}

function animateProgress(url) {
  let startTime = null;
  const duration = 2000; // 2 seconds

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    // Cubic ease-out for progression feel
    const t = 1 - Math.pow(1 - Math.min(progress / duration, 1), 3);
    
    progressFill.style.width = `${t * 100}%`;
    progressPercentage.textContent = `${Math.floor(t * 100)}%`;

    if (progress < duration) {
      requestAnimationFrame(step);
    } else {
      setTimeout(() => {
        window.open(url, "_blank");
        resetToMainCard();
      }, 200);
    }
  }
  requestAnimationFrame(step);
}

function hideActiveModal() {
  const activeModal = document.querySelector(".modal:not(.hidden)");
  if (!activeModal) return;
  
  activeModal.classList.add("hidden");
  activeModal.classList.remove("visible");
  activeModalId = null;
  
  // Bring the bio card back
  const bioCard = document.querySelector(".bio-card");
  bioCard.classList.remove("card-exit");
  bioCard.classList.add("card-enter");

  // Remove the locked glow color so it reverts to Google colors
  if (glowTimeout) {
    clearTimeout(glowTimeout);
    glowTimeout = null;
  }
  document.body.removeAttribute("data-active-glow");
  document.body.removeAttribute("data-glow");
  document.body.classList.remove("glow-active");
}

function resetToMainCard() {
  redirectModal.classList.add("hidden");
  redirectModal.classList.remove("card-enter");
  successModal.classList.add("hidden");
  successModal.classList.remove("card-enter");
  
  bioCard.style.display = "flex";
  bioCard.classList.remove("card-exit");
  bioCard.classList.add("card-enter");

  if (glowTimeout) {
    clearTimeout(glowTimeout);
    glowTimeout = null;
  }
  document.body.removeAttribute("data-active-glow");
  document.body.removeAttribute("data-glow");
  document.body.classList.remove("glow-active");

  startAvatarRotation();
  switchSnowEffect("main");

  if (friendsVisible) {
    friendsOrbit.style.display = "";
    friendsConnections.style.display = "";
    friendsOrbit.classList.remove("card-exit-friends");
    friendsConnections.classList.remove("card-exit-friends");
    
    setTimeout(() => {
      friendsOrbit.classList.add("visible");
      friendsConnections.classList.add("visible");
      updateLayoutCache(); // Reload layout coordinates
      startOrbitAnimation();
    }, 300);
  }
}

/**
 * Delta Force ID copy behavior with success modal feedback
 */
function copyDeltaForceIdWithAnimation() {
  navigator.clipboard.writeText(DELTA_FORCE_ID).catch(err => {
    console.error("Clipboard copy failed:", err);
  });

  // Pause background calculations
  stopOrbitAnimation();
  stopAvatarRotation();
  switchSnowEffect("success");

  bioCard.classList.remove("card-enter");
  bioCard.classList.add("card-exit");

  if (friendsVisible) {
    friendsOrbit.classList.add("card-exit-friends");
    friendsConnections.classList.add("card-exit-friends");
  }

  setTimeout(() => {
    bioCard.style.display = "none";
    if (friendsVisible) {
      friendsOrbit.style.display = "none";
      friendsConnections.style.display = "none";
    }

    successModal.classList.remove("hidden");
    successModal.classList.add("card-enter");

    setTimeout(() => {
      successModal.classList.remove("card-enter");
      successModal.classList.add("card-exit");
      setTimeout(() => {
        successModal.classList.remove("card-exit");
        resetToMainCard();
      }, 500);
    }, 1800);
  }, 500);
}

/**
 * Orbit Animation Calculations
 */
function showFriends() {
  friendsOrbit.classList.remove("hidden");
  initSvgLines(); // Setup SVGs once
  updateLayoutCache();
  positionFriends(currentOrbitAngle);

  setTimeout(() => {
    friendsOrbit.classList.add("visible");
    friendsConnections.classList.add("visible");
    setTimeout(() => {
      startOrbitAnimation();
    }, 600);
  }, 50);
}

function hideFriends() {
  stopOrbitAnimation();
  friendsOrbit.classList.remove("visible");
  friendsConnections.classList.remove("visible");
  setTimeout(() => {
    friendsOrbit.classList.add("hidden");
  }, 600);
}

function positionFriends(angle) {
  const friendCenters = [];

  friendAvatars.forEach((el, index) => {
    const individualAngle = friendPositions[index] + angle;
    
    // Pure math placement based on cached central positions
    const posX = layoutCache.centerX + ORBIT_RADIUS * Math.cos(individualAngle) - 40 - layoutCache.orbitLeft;
    const posY = layoutCache.centerY + ORBIT_RADIUS * Math.sin(individualAngle) - 40 - layoutCache.orbitTop;

    el.style.left = `${posX}px`;
    el.style.top = `${posY}px`;
    el.style.marginLeft = "0";
    el.style.marginTop = "0";

    // Keep track of friend centers relative to global screen for SVG lines
    friendCenters.push({
      x: layoutCache.orbitLeft + posX + 40,
      y: layoutCache.orbitTop + posY + 40
    });
  });

  updateConnectionLines(friendCenters);
}

function updateConnectionLines(friendCenters) {
  if (friendCenters.length === 0 || connectionLines.length === 0) return;

  for (let i = 0; i < 4; i++) {
    const nextIdx = (i + 1) % 4;
    
    // 1. Update outer polygon ring line coordinates
    const outerLine = outerLines[i];
    outerLine.setAttribute("x1", friendCenters[i].x);
    outerLine.setAttribute("y1", friendCenters[i].y);
    outerLine.setAttribute("x2", friendCenters[nextIdx].x);
    outerLine.setAttribute("y2", friendCenters[nextIdx].y);

    // 2. Update center line coordinates linking avatar to friend
    const connLine = connectionLines[i];
    connLine.setAttribute("x1", friendCenters[i].x);
    connLine.setAttribute("y1", friendCenters[i].y);
    connLine.setAttribute("x2", layoutCache.avatarCenterX);
    connLine.setAttribute("y2", layoutCache.avatarCenterY);
  }
}

function startOrbitAnimation() {
  if (orbitAnimationFrame) return;
  
  function animate() {
    currentOrbitAngle += ORBIT_SPEED;
    positionFriends(currentOrbitAngle);
    orbitAnimationFrame = requestAnimationFrame(animate);
  }
  orbitAnimationFrame = requestAnimationFrame(animate);
}

function stopOrbitAnimation() {
  if (orbitAnimationFrame) {
    cancelAnimationFrame(orbitAnimationFrame);
    orbitAnimationFrame = null;
  }
}

// Dynamic Glow Effects for Social Links
function setupDynamicGlowHovers() {
  const allSocialLinks = document.querySelectorAll(".social-link");
  allSocialLinks.forEach(link => {
    let glowType = "";
    if (link.classList.contains("delta-force")) {
      glowType = "delta";
    } else if (link.href && (link.href.includes("t.me") || link.href.includes("telegram"))) {
      glowType = "telegram";
    } else if (link.href && link.href.includes("tiktok")) {
      glowType = "tiktok";
    } else if (link.href && link.href.includes("roblox")) {
      glowType = "roblox";
    }

    if (glowType) {
      link.addEventListener("mouseenter", () => {
        if (glowTimeout) {
          clearTimeout(glowTimeout);
          glowTimeout = null;
        }
        document.body.setAttribute("data-glow", glowType);
        void document.body.offsetWidth;
        document.body.classList.add("glow-active");
      });
      
      link.addEventListener("mouseleave", () => {
        if (glowTimeout) {
          clearTimeout(glowTimeout);
        }
        
        glowTimeout = setTimeout(() => {
          document.body.classList.remove("glow-active");
          glowTimeout = setTimeout(() => {
            document.body.removeAttribute("data-glow");
            glowTimeout = null;
          }, 700);
        }, 50);
      });

      // When clicked, lock the glow color for the incoming modal
      link.addEventListener("click", () => {
        if (glowTimeout) {
          clearTimeout(glowTimeout);
          glowTimeout = null;
        }
        document.body.setAttribute("data-active-glow", glowType);
        document.body.classList.add("glow-active");
      });
    }
  });
}

// Initial Event listeners configuration
document.addEventListener("DOMContentLoaded", () => {
  preloadImages();
  setupVideoLoop();
  setupDynamicGlowHovers();

  // Initialize Canvas Snow instances
  const canvasIds = {
    main: "snow-canvas",
    redirect: "snow-canvas-redirect",
    success: "snow-canvas-success"
  };

  Object.entries(canvasIds).forEach(([key, id]) => {
    const canvas = document.getElementById(id);
    if (canvas) {
      snowInstances[key] = new SnowEffect(canvas);
    }
  });

  // Prevent double tap zooms on mobile
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
});

// Setup click action callbacks for redirects
socialLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const url = link.href;
    const hostname = new URL(url).hostname.replace("www.", "");
    let serviceName = "Social";

    if (hostname.includes("t.me") || hostname.includes("telegram")) {
      serviceName = "Telegram";
    } else if (hostname.includes("tiktok")) {
      serviceName = "TikTok";
    } else if (hostname.includes("roblox")) {
      serviceName = "Roblox";
    }

    const svgIcon = link.querySelector("svg").cloneNode(true);
    startRedirectFlow(url, serviceName, svgIcon);
  });
});

deltaForceBtn.addEventListener("click", e => {
  e.preventDefault();
  copyDeltaForceIdWithAnimation();
});

friendsBtn.addEventListener("click", () => {
  friendsVisible = !friendsVisible;
  if (friendsVisible) {
    showFriends();
  } else {
    hideFriends();
  }
  friendsBtn.classList.toggle("active", friendsVisible);
});



entryScreen.addEventListener("click", handleEntryClick);
entryScreen.addEventListener("touchstart", handleEntryClick, { passive: true });

window.addEventListener("resize", () => {
  updateLayoutCache();
});

document.addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && !entryScreen.classList.contains("hidden")) {
    handleEntryClick();
  }
});
