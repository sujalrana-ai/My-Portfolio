const navToggle = document.querySelector(".nav-toggle");
const navShell = document.querySelector(".nav-shell");
const navLinks = document.querySelectorAll(".nav-links a");
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");
const typedText = document.getElementById("typed-text");
const revealItems = document.querySelectorAll(".reveal");
const timeline = document.getElementById("timeline");
const tiltCards = document.querySelectorAll(".tilt-card");
const cursor = document.querySelector(".cursor");
const cursorTrail = document.querySelector(".cursor-trail");
const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const copyEmailButton = document.getElementById("copy-email");
const adminKeyInput = document.getElementById("admin-key");
const loadMessagesButton = document.getElementById("load-messages");
const messagesStatus = document.getElementById("messages-status");
const messagesList = document.getElementById("messages-list");
const year = document.getElementById("year");
const sections = document.querySelectorAll("main section[id]");
const themeOrder = ["dark", "light", "matrix"];
const storageKey = "sujal-portfolio-theme";

const apiBase =
  window.location.protocol === "file:"
    ? "http://127.0.0.1:8000/api"
    : window.PORTFOLIO_API_BASE || "/api";

const themeCopy = {
  dark: { symbol: "D", aria: "Dark mode" },
  light: { symbol: "L", aria: "Light mode" },
  matrix: { symbol: "M", aria: "Matrix mode" }
};

function getStoredTheme() {
  try {
    return window.localStorage.getItem(storageKey);
  } catch (error) {
    return null;
  }
}

function setStoredTheme(theme) {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch (error) {
    // Ignore storage failures in private browsing or locked-down contexts.
  }
}

function closeNav() {
  if (!navShell || !navToggle) return;
  navShell.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMessageDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function renderMessages(messages) {
  if (!messagesList) return;

  if (!messages.length) {
    messagesList.innerHTML =
      '<div class="message-item"><p class="message-body">No messages yet.</p></div>';
    return;
  }

  messagesList.innerHTML = messages
    .map(
      (message) =>
        '<article class="message-item">' +
        '<div class="message-head">' +
        "<div>" +
        "<strong>" +
        escapeHtml(message.name) +
        "</strong>" +
        '<a class="message-meta" href="mailto:' +
        escapeHtml(message.email) +
        '">' +
        escapeHtml(message.email) +
        "</a>" +
        "</div>" +
        '<span class="message-time">' +
        escapeHtml(formatMessageDate(message.created_at)) +
        "</span>" +
        "</div>" +
        '<p class="message-body">' +
        escapeHtml(message.message) +
        "</p>" +
        "</article>"
    )
    .join("");
}

function applyTheme(theme) {
  const safeTheme = themeOrder.includes(theme) ? theme : "dark";
  document.body.dataset.theme = safeTheme;
  setStoredTheme(safeTheme);

  if (themeLabel) {
    themeLabel.textContent = themeCopy[safeTheme].symbol;
  }

  if (themeToggle) {
    themeToggle.setAttribute("aria-label", "Theme: " + themeCopy[safeTheme].aria);
  }
}

if (year) {
  year.textContent = new Date().getFullYear();
}

applyTheme(getStoredTheme() || "dark");
window.requestAnimationFrame(() => {
  document.body.classList.add("theme-ready");
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.body.dataset.theme || "dark";
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    applyTheme(nextTheme);
  });
}

if (navToggle && navShell) {
  navToggle.addEventListener("click", () => {
    const isOpen = navShell.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".nav-links a, .nav-actions a").forEach((link) => {
    link.addEventListener("click", () => {
      closeNav();
    });
  });

  document.addEventListener("click", (event) => {
    if (!navShell.classList.contains("is-open")) return;
    if (navShell.contains(event.target) || navToggle.contains(event.target)) return;
    closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });
}

const words = ["AI Engineer", "LLM Builder", "RAG Specialist"];
let wordIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  if (!typedText) return;

  const currentWord = words[wordIndex];
  typedText.textContent = deleting
    ? currentWord.slice(0, charIndex--)
    : currentWord.slice(0, charIndex++);

  let delay = deleting ? 48 : 96;

  if (!deleting && charIndex === currentWord.length + 1) {
    delay = 1050;
    deleting = true;
  } else if (deleting && charIndex === -1) {
    deleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    charIndex = 0;
    delay = 180;
  }

  window.setTimeout(typeLoop, delay);
}

typeLoop();

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => {
    if (!item.classList.contains("is-visible")) {
      revealObserver.observe(item);
    }
  });
} else {
  revealItems.forEach((item) => {
    item.classList.add("is-visible");
  });
}

function updateTimelineProgress() {
  if (!timeline) return;
  const rect = timeline.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const start = viewportHeight * 0.82;
  const progress = ((start - rect.top) / rect.height) * 100;
  const clamped = Math.max(0, Math.min(progress, 100));
  timeline.style.setProperty("--timeline-progress", clamped + "%");
}

function updateActiveNav() {
  const scrollPoint = window.scrollY + 180;
  let currentId = "";

  sections.forEach((section) => {
    if (scrollPoint >= section.offsetTop) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    link.classList.toggle("is-active", href === "#" + currentId);
  });
}

updateTimelineProgress();
updateActiveNav();
window.addEventListener("scroll", updateTimelineProgress, { passive: true });
window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("resize", updateTimelineProgress);

tiltCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = (x / rect.width - 0.5) * 5;
    const rotateX = (0.5 - y / rect.height) * 5;
    card.style.transform =
      "perspective(1200px) rotateX(" +
      rotateX +
      "deg) rotateY(" +
      rotateY +
      "deg) translateY(-5px)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

if (window.matchMedia("(pointer:fine)").matches && cursor && cursorTrail) {
  document.body.classList.add("has-custom-cursor");
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let trailX = cursorX;
  let trailY = cursorY;

  window.addEventListener("mousemove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    cursor.style.transform = "translate(" + cursorX + "px," + cursorY + "px)";
  });

  function animateTrail() {
    trailX += (cursorX - trailX) * 0.18;
    trailY += (cursorY - trailY) * 0.18;
    cursorTrail.style.transform = "translate(" + trailX + "px," + trailY + "px)";
    window.requestAnimationFrame(animateTrail);
  }

  animateTrail();
}

if (copyEmailButton && formStatus) {
  copyEmailButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("sujalr7176@gmail.com");
      formStatus.textContent = "Email copied: sujalr7176@gmail.com";
    } catch (error) {
      formStatus.textContent =
        "Could not copy automatically. Email: sujalr7176@gmail.com";
    }
  });
}

if (loadMessagesButton && adminKeyInput && messagesStatus && messagesList) {
  loadMessagesButton.addEventListener("click", async () => {
    const adminKey = adminKeyInput.value.trim();

    if (!adminKey) {
      messagesStatus.textContent = "Enter the inbox key first.";
      return;
    }

    messagesStatus.textContent = "Loading messages...";

    try {
      const response = await fetch(apiBase + "/contact/messages", {
        headers: {
          "X-Admin-Key": adminKey
        }
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const messages = await response.json();
      messagesStatus.textContent = "Messages loaded.";
      renderMessages(messages);
    } catch (error) {
      messagesStatus.textContent =
        "Could not load messages. Check the inbox key and backend server.";
    }
  });
}

if (form && formStatus) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const senderEmail = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const savedAdminKey = adminKeyInput ? adminKeyInput.value : "";

    formStatus.textContent = "Sending message...";

    try {
      const response = await fetch(apiBase + "/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          email: senderEmail,
          message: message,
          source: "portfolio"
        })
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      formStatus.textContent = "Message sent successfully.";
      form.reset();

      if (adminKeyInput) {
        adminKeyInput.value = savedAdminKey;
      }
    } catch (error) {
      formStatus.textContent =
        "Could not send right now. Make sure the backend is running on port 8000.";
    }
  });
}
