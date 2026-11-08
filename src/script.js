
const TG_USERNAME = "s0tkka";
const DEFAULT_AVATAR = "avatars/current_avatar.jpg";

let currentVideoIndex = 0;
let isSwitchingVideo = false;
let videoElements = [];
const DELTA_FORCE_ID = "27544840130911559978";
let isBirthday = false;
let birthdaySynth = null;

class HappyBirthdayAudio {
  constructor() {
    this.audio = new Audio('happy.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.5;
    this.audio.preload = 'auto';
    this.audio.load(); 
  }

  start() {
    this.audio.play().catch(e => console.log('Audio playback failed:', e));
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

function checkBirthday() {
  const today = new Date();
  isBirthday = today.getMonth() === 5 && today.getDate() === 26;
  return isBirthday;
}

function getBirthdayTooltipText() {
  const now = new Date();
  const year = now.getFullYear();
  const birthYear = 2011; 
  const age = Math.min(year - birthYear, 25);
  
  let ageString = "";
  const lastDigit = age % 10;
  const lastTwoDigits = age % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    ageString = `${age} лет`;
  } else if (lastDigit === 1) {
    ageString = `${age} год`;
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    ageString = `${age} года`;
  } else {
    ageString = `${age} лет`;
  }

  const birthdayThisYear = new Date(year, 5, 26);
  const isTodayBirthday = now.getMonth() === 5 && now.getDate() === 26;
  
  if (isTodayBirthday) {
    return `Сегодня мне исполнилось ${ageString}!`;
  }
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (todayStart >= birthdayThisYear) {
    return `В этом году мне исполнилось ${ageString}!`;
  } else {
    return `В этом году мне исполнится ${ageString}!`;
  }
}

function initBirthdayState() {
  checkBirthday();
  const tooltipTextEl = document.getElementById("cake-tooltip-text");
  if (tooltipTextEl) {
    tooltipTextEl.textContent = getBirthdayTooltipText();
  }
  
  if (isBirthday) {
    document.body.classList.add("birthday-theme");
    if (!birthdaySynth) {
      birthdaySynth = new HappyBirthdayAudio();
    }

    const cakeContainer = document.getElementById("birthday-cake-container");
    const bioCardElement = document.querySelector(".bio-card");
    if (cakeContainer && bioCardElement) {
      let isCakeClicked = false;
      cakeContainer.addEventListener("mouseenter", () => bioCardElement.classList.add("cake-expanded"));
      cakeContainer.addEventListener("mouseleave", () => {
        if (!isCakeClicked) bioCardElement.classList.remove("cake-expanded");
      });
      cakeContainer.addEventListener("click", () => {
        isCakeClicked = !isCakeClicked;
        if (isCakeClicked) bioCardElement.classList.add("cake-expanded");
        else bioCardElement.classList.remove("cake-expanded");
      });
    }
  }
}
const entryScreen = document.getElementById("entry-screen");
const mainContent = document.getElementById("main-content");
const avatar = document.getElementById("avatar");
const deltaForceBtn = document.getElementById("delta-force-btn");
const copyNotification = document.getElementById("copy-notification");

const redirectModal = document.getElementById("redirect-modal");
const successModal = document.getElementById("success-modal");
const bioCard = document.querySelector(".bio-card");
const redirectIconContainer = document.getElementById("redirect-icon-container");
const redirectText = document.getElementById("redirect-text");
const progressFill = document.getElementById("progress-fill");
const progressPercentage = document.getElementById("progress-percentage");
const socialLinks = document.querySelectorAll(".social-link:not(.delta-force)");

let glowTimeout = null;


function initAvatar() {
  const avatarEl = document.getElementById("avatar");
  try {
    localStorage.removeItem("shdw_tg_avatar");
  } catch (e) {}

  if (avatarEl) {
    avatarEl.onerror = () => {
      if (avatarEl.src !== DEFAULT_AVATAR && !avatarEl.src.endsWith(DEFAULT_AVATAR)) {
        avatarEl.src = DEFAULT_AVATAR;
      }
    };
  }
}

function preloadImages() {
  initAvatar();
}

function startAvatarRotation() {}
function stopAvatarRotation() {}




function setupVideoLoop() {
  videoElements = [
    document.getElementById("bg-video-0"),
    document.getElementById("bg-video-1"),
    document.getElementById("bg-video-2")
  ].filter(Boolean);

  if (videoElements.length <= 1) {
    videoElements.forEach(vid => {
      vid.preload = "auto";
      vid.loop = true;
      vid.addEventListener("ended", () => {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      });
    });
    return;
  }

  videoElements.forEach((vid, index) => {
    vid.preload = "auto";
    vid.addEventListener("timeupdate", () => {
      if (index === currentVideoIndex && !isSwitchingVideo && vid.duration > 0) {
        if (vid.currentTime >= vid.duration - 0.08) {
          transitionToNextVideo();
        }
      }
    });
    vid.addEventListener("ended", () => {
      if (index === currentVideoIndex && !isSwitchingVideo) {
        transitionToNextVideo();
      }
    });
  });
}

function transitionToNextVideo() {
  if (isSwitchingVideo || videoElements.length <= 1) return;
  isSwitchingVideo = true;

  const prevIndex = currentVideoIndex;
  const currentVid = videoElements[prevIndex];
  const nextIndex = (prevIndex + 1) % videoElements.length;
  const nextVid = videoElements[nextIndex];

  if (!nextVid) {
    isSwitchingVideo = false;
    return;
  }

  nextVid.currentTime = 0;
  if (isBirthday) {
    nextVid.muted = true;
    nextVid.volume = 0;
  } else {
    nextVid.muted = false;
    nextVid.volume = 1;
  }

  const finish = () => {
    if (currentVid && currentVid !== nextVid) {
      currentVid.classList.remove("active");
      currentVid.pause();
      currentVid.currentTime = 0;
    }
    currentVideoIndex = nextIndex;
    isSwitchingVideo = false;
  };

  nextVid.classList.add("active");
  const playPromise = nextVid.play();

  if (playPromise !== undefined) {
    playPromise.then(finish).catch(err => {
      console.warn("Unmuted play rejected on transition, retrying muted:", err);
      nextVid.muted = true;
      nextVid.play().then(finish).catch(finish);
    });
  } else {
    finish();
  }
}

function playVideo() {
  const currentVid = videoElements[currentVideoIndex] || videoElements[0];
  if (!currentVid) return;

  if (isBirthday) {
    currentVid.muted = true;
    currentVid.volume = 0;
  } else {
    currentVid.muted = false;
    currentVid.volume = 1;
  }

  const p = currentVid.play();
  if (p !== undefined) {
    p.catch(e => {
      console.warn("Audio play rejected, falling back to muted:", e);
      currentVid.muted = true;
      currentVid.play().catch(err => {
        console.warn("Muted play failed:", err);
      });
    });
  }
}


function handleEntryClick() {
  entryScreen.classList.add("hidden");
  setTimeout(() => {
    mainContent.classList.add("visible");
    startAllSnow();
  }, 300);

  // Directly play the active video within the user gesture to satisfy mobile policies
  const activeVid = videoElements[currentVideoIndex] || videoElements[0];
  if (activeVid) {
    if (isBirthday) {
      activeVid.muted = true;
      activeVid.volume = 0;
    } else {
      activeVid.muted = false;
      activeVid.volume = 1;
    }
    const p = activeVid.play();
    if (p !== undefined) {
      p.catch(() => {
        activeVid.muted = true;
        activeVid.play().catch(e => console.warn(e));
      });
    }
  }

  // Warm-up and unlock other video elements within user gesture
  videoElements.forEach((vid, i) => {
    if (i !== currentVideoIndex && vid) {
      vid.muted = true;
      const p2 = vid.play();
      if (p2 !== undefined) {
        p2.then(() => {
          vid.pause();
          vid.currentTime = 0;
        }).catch(() => {});
      }
    }
  });

  if (isBirthday) {
    if (!birthdaySynth) {
      birthdaySynth = new HappyBirthdayAudio();
    }
    birthdaySynth.start();
  }
  startAvatarRotation();
}


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
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

class ParticleTextSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.isMobile = false;

    this.pointer = {
      x: -9999,
      y: -9999,
      active: false
    };

    this.text = 'СОТКА';
    this.fontFamily = 'Unbounded';
    this.fontWeight = '900';
    this.influenceRadius = 85;
    this.maxPush = 14;
    this.springFactor = 0.15;

    // Theme color management
    this.themeWeight = 0;
    this.targetThemeWeight = 0;
    this.currentThemeR = 255;
    this.currentThemeG = 255;
    this.currentThemeB = 255;
    this.targetThemeR = 255;
    this.targetThemeG = 255;
    this.targetThemeB = 255;

    this.isRunning = false;
    this.animationFrameId = null;
    this.resizeTimeout = null;

    this.setupListeners();
    this.init();
  }

  setTheme(themeName) {
    const THEME_COLORS = {
      telegram: { r: 34, g: 158, b: 217 },    // #229ED9
      tiktok:   { r: 254, g: 44, b: 85 },     // #fe2c55
      roblox:   { r: 45, g: 115, b: 255 },    // #2d73ff
      delta:    { r: 0, g: 255, b: 136 }      // #00ff88
    };

    const theme = THEME_COLORS[themeName];
    if (theme) {
      this.targetThemeR = theme.r;
      this.targetThemeG = theme.g;
      this.targetThemeB = theme.b;
      this.targetThemeWeight = 1.0;
    } else {
      this.targetThemeWeight = 0.0;
    }
  }

  setupListeners() {
    const handlePointerMove = (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const margin = 120;
      if (
        e.clientX >= rect.left - margin &&
        e.clientX <= rect.right + margin &&
        e.clientY >= rect.top - margin &&
        e.clientY <= rect.bottom + margin
      ) {
        this.pointer.x = e.clientX - rect.left;
        this.pointer.y = e.clientY - rect.top;
        this.pointer.active = true;
      } else {
        this.pointer.active = false;
      }
    };

    const handlePointerLeave = () => {
      this.pointer.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerLeave, { passive: true });
    window.addEventListener('pointercancel', handlePointerLeave, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        handlePointerMove(e.touches[0]);
      }
    }, { passive: true });
    window.addEventListener('touchend', handlePointerLeave, { passive: true });

    window.addEventListener('resize', () => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 100);
    }, { passive: true });
  }

  async init() {
    try {
      if (document.fonts) {
        await document.fonts.load('900 50px "Unbounded"');
        await document.fonts.ready;
      }
    } catch (e) {
      console.warn('Font loading error:', e);
    }

    this.buildParticles();
    this.start();

    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.buildParticles();
      });
    }
  }

  handleResize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w !== this.width || h !== this.height) {
      this.buildParticles();
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].alpha = this.particles[i].baseAlpha;
      }
    }
  }

  buildParticles() {
    if (!this.canvas) return;

    this.isMobile = window.innerWidth <= 480;
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.round(rect.width) || (this.isMobile ? 256 : 300);
    const cssHeight = Math.round(rect.height) || (this.isMobile ? 56 : 76);

    this.width = cssWidth;
    this.height = cssHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    this.canvas.width = Math.round(cssWidth * this.dpr);
    this.canvas.height = Math.round(cssHeight * this.dpr);

    const fontSize = this.isMobile ? 38 : 50;
    const scaleY = this.isMobile ? 1.4 : 1.5;
    const letterGap = this.isMobile ? 6 : 9;
    const step = 2;
    const baseRadius = this.isMobile ? 0.72 : 0.78;

    this.influenceRadius = this.isMobile ? 70 : 85;
    this.maxPush = this.isMobile ? 11 : 15;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = cssWidth;
    offCanvas.height = cssHeight;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

    offCtx.save();
    offCtx.translate(cssWidth / 2, cssHeight / 2);
    offCtx.scale(1, scaleY);
    offCtx.font = `${this.fontWeight} ${fontSize}px "${this.fontFamily}", sans-serif`;
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = '#ffffff';

    const chars = ['С', 'О', 'Т', 'К', 'А'];
    const widths = chars.map(ch => offCtx.measureText(ch).width);
    const sumWidths = widths.reduce((a, b) => a + b, 0);
    const totalWidth = sumWidths + (chars.length - 1) * letterGap;

    const m = offCtx.measureText('О');
    const yOffset = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;

    let currentX = -totalWidth / 2;
    for (let i = 0; i < chars.length; i++) {
      offCtx.textAlign = 'left';
      offCtx.fillText(chars[i], currentX, yOffset);
      currentX += widths[i] + letterGap;
    }
    offCtx.restore();

    const imgData = offCtx.getImageData(0, 0, cssWidth, cssHeight).data;

    const startX = Math.floor((cssWidth % step) / 2);
    const startY = Math.floor((cssHeight % step) / 2);

    let minY = Infinity;
    let maxY = -Infinity;

    for (let y = startY; y < cssHeight; y += step) {
      for (let x = startX; x < cssWidth; x += step) {
        const idx = (y * cssWidth + x) * 4 + 3;
        if (imgData[idx] > 120) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const textHeight = Math.max(maxY - minY, 1);
    const newParticles = [];

    for (let y = startY; y < cssHeight; y += step) {
      for (let x = startX; x < cssWidth; x += step) {
        const idx = (y * cssWidth + x) * 4 + 3;
        const alpha = imgData[idx];

        if (alpha > 120) {
          const normY = Math.max(0, Math.min(1, (y - minY) / textHeight));
          let defR, defG, defB, baseAlpha;
          if (normY <= 0.4) {
            defR = 255;
            defG = 255;
            defB = 255;
            baseAlpha = 1.0;
          } else {
            const t = (normY - 0.4) / 0.6;
            defR = Math.round(255 - t * (255 - 184));
            defG = Math.round(255 - t * (255 - 184));
            defB = Math.round(255 - t * (255 - 192));
            baseAlpha = 1.0 - t * 0.22;
          }

          const edgeWeight = Math.min(1, alpha / 220);
          baseAlpha *= edgeWeight;

          newParticles.push({
            originX: x,
            originY: y,
            x: x,
            y: y,
            defR,
            defG,
            defB,
            r: defR,
            g: defG,
            b: defB,
            normY,
            baseAlpha,
            alpha: baseAlpha,
            radius: baseRadius,
            targetX: x,
            targetY: y,
            targetAlpha: baseAlpha
          });
        }
      }
    }

    this.particles = newParticles;
  }

  update() {
    const pointer = this.pointer;
    const radius = this.influenceRadius;
    const maxPush = this.maxPush;
    const spring = this.springFactor;
    const particles = this.particles;

    const colorSpeed = 0.085;
    this.themeWeight += (this.targetThemeWeight - this.themeWeight) * colorSpeed;
    this.currentThemeR += (this.targetThemeR - this.currentThemeR) * colorSpeed;
    this.currentThemeG += (this.targetThemeG - this.currentThemeG) * colorSpeed;
    this.currentThemeB += (this.targetThemeB - this.currentThemeB) * colorSpeed;

    const tw = this.themeWeight;
    const isThemed = tw > 0.002;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      if (pointer.active) {
        const dx = p.originX - pointer.x;
        const dy = p.originY - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const ratio = dist / radius;
          const fade = Math.pow(ratio, 1.6);
          p.targetAlpha = p.baseAlpha * fade;

          const force = (1 - ratio);
          const push = force * maxPush;
          const angle = Math.atan2(dy, dx);
          p.targetX = p.originX + Math.cos(angle) * push;
          p.targetY = p.originY + Math.sin(angle) * push;
        } else {
          p.targetAlpha = p.baseAlpha;
          p.targetX = p.originX;
          p.targetY = p.originY;
        }
      } else {
        p.targetAlpha = p.baseAlpha;
        p.targetX = p.originX;
        p.targetY = p.originY;
      }

      p.x += (p.targetX - p.x) * spring;
      p.y += (p.targetY - p.y) * spring;
      p.alpha += (p.targetAlpha - p.alpha) * spring;

      if (!isThemed) {
        p.r = p.defR;
        p.g = p.defG;
        p.b = p.defB;
      } else {
        const highlight = (1 - p.normY) * 28 * tw;
        const tr = Math.min(255, this.currentThemeR + highlight);
        const tg = Math.min(255, this.currentThemeG + highlight);
        const tb = Math.min(255, this.currentThemeB + highlight);

        p.r = Math.round(p.defR * (1 - tw) + tr * tw);
        p.g = Math.round(p.defG * (1 - tw) + tg * tw);
        p.b = Math.round(p.defB * (1 - tw) + tb * tw);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const particles = this.particles;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0.01) continue;

      const currentRadius = p.radius * (0.35 + 0.65 * (p.alpha / p.baseAlpha));

      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  animate() {
    if (!this.isRunning) return;
    if (this.canvas.offsetParent !== null) {
      this.update();
      this.draw();
    }
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
  }
}

let particleTextSystem = null;
const snowInstances = {
  main: null,
  redirect: null,
  success: null
};

function startAllSnow() {
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


function startRedirectFlow(url, name, svgIcon) {
  stopAvatarRotation();
  switchSnowEffect("redirect");
  if (birthdaySynth) {
    birthdaySynth.stop();
  }

  bioCard.classList.remove("card-enter");
  bioCard.classList.add("card-exit");



  setTimeout(() => {
    redirectIconContainer.innerHTML = "";
    redirectIconContainer.appendChild(svgIcon);
    redirectText.textContent = `Перенаправляем в ${name}`;
    progressFill.style.width = "0%";
    progressPercentage.textContent = "0%";
    
    bioCard.style.display = "none";

    redirectModal.classList.remove("hidden");
    requestAnimationFrame(() => animateProgress(url));
  }, 500);
}

function animateProgress(url) {
  let startTime = null;
  const duration = 2000; 

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
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
  const bioCard = document.querySelector(".bio-card");
  bioCard.classList.remove("card-exit");
  bioCard.classList.add("card-enter");
  if (glowTimeout) {
    clearTimeout(glowTimeout);
    glowTimeout = null;
  }
  document.body.removeAttribute("data-active-glow");
  document.body.removeAttribute("data-glow");
  document.body.classList.remove("glow-active");
}

function resetToMainCard() {
  if (particleTextSystem) {
    particleTextSystem.setTheme(null);
  }
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
  if (isBirthday && birthdaySynth) {
    birthdaySynth.start();
  }


}


function copyDeltaForceIdWithAnimation() {
  navigator.clipboard.writeText(DELTA_FORCE_ID).catch(err => {
    console.error("Clipboard copy failed:", err);
  });
  stopAvatarRotation();
  switchSnowEffect("success");
  if (birthdaySynth) {
    birthdaySynth.stop();
  }

  bioCard.classList.remove("card-enter");
  bioCard.classList.add("card-exit");

  setTimeout(() => {
    bioCard.style.display = "none";

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

function setupDynamicGlowHovers() {
  const bioCardEl = document.querySelector(".bio-card");
  const allSocialLinks = document.querySelectorAll(".social-link");
  const avatarContainer = document.querySelector(".avatar-container");
  const cakeContainer = document.getElementById("birthday-cake-container");

  const activateGlow = (type) => {
    if (glowTimeout) {
      clearTimeout(glowTimeout);
      glowTimeout = null;
    }
    if (type) {
      document.body.setAttribute("data-glow", type);
    } else {
      document.body.removeAttribute("data-glow");
    }
    document.body.classList.add("glow-active");
    if (bioCardEl) bioCardEl.classList.add("touch-active");
    if (particleTextSystem) {
      particleTextSystem.setTheme(type);
    }
  };

  const deactivateGlow = (delay = 200) => {
    if (particleTextSystem) {
      particleTextSystem.setTheme(null);
    }
    if (glowTimeout) clearTimeout(glowTimeout);
    glowTimeout = setTimeout(() => {
      document.body.classList.remove("glow-active");
      if (bioCardEl) bioCardEl.classList.remove("touch-active");
      glowTimeout = setTimeout(() => {
        document.body.removeAttribute("data-glow");
        glowTimeout = null;
      }, 350);
    }, delay);
  };

  if (bioCardEl) {
    bioCardEl.addEventListener("mouseenter", () => {
      if (!document.body.getAttribute("data-glow")) {
        activateGlow("");
      }
    });
    bioCardEl.addEventListener("mouseleave", () => {
      deactivateGlow(50);
    });

    bioCardEl.addEventListener("touchstart", (e) => {
      const link = e.target.closest(".social-link, .avatar-container, #birthday-cake-container");
      if (!link) {
        activateGlow("");
      }
    }, { passive: true });

    bioCardEl.addEventListener("touchend", () => {
      deactivateGlow(500);
    }, { passive: true });
  }

  if (avatarContainer) {
    avatarContainer.addEventListener("mouseenter", () => activateGlow("avatar"));
    avatarContainer.addEventListener("mouseleave", () => deactivateGlow(50));
    avatarContainer.addEventListener("touchstart", () => activateGlow("avatar"), { passive: true });
  }

  if (cakeContainer) {
    cakeContainer.addEventListener("mouseenter", () => activateGlow("birthday"));
    cakeContainer.addEventListener("mouseleave", () => deactivateGlow(50));
    cakeContainer.addEventListener("touchstart", () => activateGlow("birthday"), { passive: true });
  }

  allSocialLinks.forEach(link => {
    let glowType = "";
    if (link.classList.contains("delta-force")) {
      glowType = "delta";
    } else if (link.href && (link.href.includes("t.me") || link.href.includes("telegram") || link.href.includes("s0tkka"))) {
      glowType = "telegram";
    } else if (link.href && link.href.includes("tiktok")) {
      glowType = "tiktok";
    } else if (link.href && link.href.includes("roblox")) {
      glowType = "roblox";
    }

    if (glowType) {
      link.addEventListener("mouseenter", (e) => {
        e.stopPropagation();
        activateGlow(glowType);
      });
      link.addEventListener("mouseleave", () => deactivateGlow(50));
      link.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        activateGlow(glowType);
      }, { passive: true });
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
document.addEventListener("DOMContentLoaded", () => {
  initBirthdayState();
  preloadImages();
  setupVideoLoop();
  setupDynamicGlowHovers();
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

  const particleCanvas = document.getElementById("particle-text-canvas");
  if (particleCanvas) {
    particleTextSystem = new ParticleTextSystem(particleCanvas);
  }

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
});
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



entryScreen.addEventListener("click", handleEntryClick);
entryScreen.addEventListener("touchstart", handleEntryClick, { passive: true });
document.addEventListener("visibilitychange", () => {
  const activeVid = videoElements[currentVideoIndex];
  if (document.hidden) {
    if (activeVid) activeVid.pause();
    stopAvatarRotation();
    if (birthdaySynth) {
      birthdaySynth.stop();
    }
    if (particleTextSystem) {
      particleTextSystem.stop();
    }
  } else {
    if (particleTextSystem) {
      particleTextSystem.start();
    }
    if (entryScreen.classList.contains("hidden")) {
      const isModalActive = !redirectModal.classList.contains("hidden") || !successModal.classList.contains("hidden");
      if (!isModalActive) {
        if (isBirthday) {
          if (activeVid) {
            activeVid.muted = true;
            activeVid.volume = 0;
            activeVid.play().catch(err => console.warn(err));
          }
          if (birthdaySynth) {
            birthdaySynth.start();
          }
        } else {
          playVideo();
        }
      }
      startAvatarRotation();
    }
  }
});

document.addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && !entryScreen.classList.contains("hidden")) {
    handleEntryClick();
  }
});
