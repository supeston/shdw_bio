
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


function fetchTelegramAvatar() {
  const avatarEl = document.getElementById("avatar");
  const cached = localStorage.getItem("shdw_tg_avatar");
  if (cached && avatarEl) {
    avatarEl.src = cached;
  }

  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://t.me/${TG_USERNAME}`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://t.me/${TG_USERNAME}`)}`
  ];

  (async () => {
    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl);
        if (!res.ok) continue;
        let html = "";
        if (proxyUrl.includes("allorigins")) {
          const data = await res.json();
          html = data.contents || "";
        } else {
          html = await res.text();
        }
        const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (match && match[1]) {
          const newUrl = match[1];
          if (avatarEl && avatarEl.src !== newUrl) {
            const preloader = new Image();
            preloader.onload = () => {
              avatarEl.classList.add("changing");
              setTimeout(() => {
                avatarEl.src = newUrl;
                avatarEl.classList.remove("changing");
                localStorage.setItem("shdw_tg_avatar", newUrl);
              }, 150);
            };
            preloader.src = newUrl;
          }
          break;
        }
      } catch (e) {}
    }
  })();
}

function preloadImages() {
  fetchTelegramAvatar();
}

function startAvatarRotation() {}
function stopAvatarRotation() {}




function setupVideoLoop() {
  videoElements = [
    document.getElementById("bg-video-0"),
    document.getElementById("bg-video-1"),
    document.getElementById("bg-video-2")
  ].filter(Boolean);

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
  } else {
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
