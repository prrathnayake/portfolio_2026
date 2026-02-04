(() => {
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  function setNavOpen(isOpen) {
    if (!nav || !navToggle || !navLinks) return;
    nav.dataset.open = String(isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  }

  navToggle?.addEventListener("click", () => {
    const isOpen = nav?.dataset.open === "true";
    setNavOpen(!isOpen);
  });

  navLinks?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLAnchorElement)) return;
    if (!target.getAttribute("href")?.startsWith("#")) return;
    setNavOpen(false);
  });

  // Active section highlight
  const sectionIds = [
    "home",
    "about",
    "skills",
    "projects",
    "experience",
    "education",
    "contact",
  ];
  const sectionEls = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const linkById = new Map(
    sectionIds.map((id) => [id, document.querySelector(`a[href="#${id}"]`)])
  );

  function setActiveNav(id) {
    for (const [key, el] of linkById.entries()) {
      if (!(el instanceof HTMLAnchorElement)) continue;
      if (key === id) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    }
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most visible section.
        const visible = entries
          .filter((x) => x.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        if (visible.length > 0) setActiveNav(visible[0].target.id);
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0.1, 0.2, 0.4, 0.6],
      }
    );
    sectionEls.forEach((el) => observer.observe(el));
  }

  // Scroll reveal animations
  const revealItems = Array.from(document.querySelectorAll("main .container"));
  revealItems.forEach((el, index) => {
    el.classList.add("reveal");
    const delay = Math.min(index * 80, 320);
    el.style.setProperty("--delay", `${delay}ms`);
  });

  function elementInView(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
  }

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    revealItems.forEach((el) => {
      if (elementInView(el)) {
        el.classList.add("is-visible");
      } else {
        revealObserver.observe(el);
      }
    });
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  // Chip icons
  const iconMap = {
    "Backend Systems": "generic",
    "Event-Driven Architecture": "generic",
    "Automation Workflows": "generic",
    "Secure Coding": "shield",
    "Prompt Engineering": "generic",
    "Local LLM Tooling": "generic",
    Python: "python",
    "C++": "cplusplus",
    JavaScript: "javascript",
    Dart: "dart",
    SQL: "database",
    Kafka: "kafka",
    Docker: "docker",
    Git: "git",
    "GitHub Actions": "githubactions",
    "AWS (fundamentals)": "amazonaws",
    LangChain: "langchain",
    LangGraph: "langgraph",
    "OpenAI API": "openai",
    "REST API": "generic",
    "HTTP": "generic",
    "HTTP Client": "generic",
    "gRPC": "generic",
    "RabbitMQ": "generic",
    "H3": "generic",
    "Protobuf": "generic",
    "State Management": "generic",
    "Google Maps": "generic",
    "Conan": "generic",
    "appWrite": "generic",
    "Redux": "generic",
    "Firecrawl": "generic",
    "dotenv": "generic",
    "Logging": "generic",
    "JWT": "shield",
    n8n: "n8n",
    "Node.js": "nodedotjs",
    "NodeJS": "nodedotjs",
    React: "react",
    "React Native": "react",
    "ReactJS": "react",
    Flutter: "flutter",
    REST: "generic",
    MongoDB: "mongodb",
    MySQL: "mysql",
    Firebase: "firebase",
    "Threat-aware Design": "shield",
    "Agile / SDLC": "generic",
    "CI/CD": "generic",
    Postman: "postman",
    Wireshark: "wireshark",
    Metasploit: "metasploit",
    "Kali Linux": "kalilinux",
    "VS Code": "visualstudiocode",
    Linux: "linux",
    WSL: "windows",
    "Docker Desktop": "docker",
    "Claude Code": "anthropic",
    Codex: "openai",
  };

  function applyChipIcons(root = document) {
    root.querySelectorAll(".chip").forEach((chip) => {
      if (chip.querySelector(".chip__icon")) return;
      const label = chip.textContent.trim();
      const slug = iconMap[label];
      if (!slug) return;
      const img = document.createElement("img");
      img.className = "chip__icon";
      img.src = `/static/assets/icons/${slug}.svg`;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.setAttribute("aria-hidden", "true");
      chip.prepend(img);
    });
  }

  applyChipIcons();

  // Contact form
  const form = document.querySelector("[data-contact-form]");
  const statusEl = document.querySelector("[data-contact-status]");
  const submitBtn = document.querySelector("[data-contact-submit]");

  function setStatus(kind, message) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.kind = kind;
  }

  async function submitContactForm(e) {
    e.preventDefault();
    if (!(form instanceof HTMLFormElement)) return;

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setStatus("error", "Please fill in all fields.");
      return;
    }

    submitBtn?.setAttribute("disabled", "true");
    setStatus("info", "Sending…");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Something went wrong.");
      }
      form.reset();
      setStatus("success", "Message sent. Thanks—I'll get back to you soon.");
    } catch (err) {
      setStatus(
        "error",
        err instanceof Error ? err.message : "Failed to send message."
      );
    } finally {
      submitBtn?.removeAttribute("disabled");
    }
  }

  form?.addEventListener("submit", submitContactForm);

  // Chat modal
  const chatModal = document.querySelector("[data-chat-modal]");
  const chatOpen = document.querySelector("[data-chat-open]");
  const chatCloseButtons = document.querySelectorAll("[data-chat-close]");
  const chatForm = document.querySelector("[data-chat-form]");
  const chatInput = document.querySelector("[data-chat-input]");
  const chatMessages = document.querySelector("[data-chat-messages]");
  const chatStatus = document.querySelector("[data-chat-status]");
  const chatSuggestions = document.querySelector("[data-chat-suggestions]");

  function setChatOpen(isOpen) {
    if (!chatModal) return;
    chatModal.dataset.open = String(isOpen);
    chatModal.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) {
      setTimeout(() => chatInput?.focus(), 50);
    }
  }

  function appendBoldText(el, text) {
    const parts = text.split("**");
    parts.forEach((part, index) => {
      if (!part) return;
      if (index % 2 === 1) {
        const strong = document.createElement("strong");
        strong.textContent = part;
        el.appendChild(strong);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  function renderChatMessage(text) {
    const fragment = document.createDocumentFragment();
    const lines = text.split(/\r?\n/);
    let paragraphParts = [];
    let listEl = null;
    let headingEl = null;

    function flushParagraph() {
      if (paragraphParts.length === 0) return;
      const p = document.createElement("p");
      appendBoldText(p, paragraphParts.join(" "));
      fragment.appendChild(p);
      paragraphParts = [];
    }

    function flushList() {
      if (!listEl) return;
      fragment.appendChild(listEl);
      listEl = null;
    }

    function flushHeading() {
      if (!headingEl) return;
      fragment.appendChild(headingEl);
      headingEl = null;
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushList();
        flushHeading();
        continue;
      }

      if (trimmed.startsWith("#")) {
        flushParagraph();
        flushList();
        flushHeading();
        const level = Math.min(3, trimmed.match(/^#+/)?.[0].length || 1);
        const headingText = trimmed.replace(/^#+\s*/, "").trim();
        const heading = document.createElement(level === 1 ? "h3" : "h4");
        heading.className = "chat-heading";
        appendBoldText(heading, headingText);
        headingEl = heading;
        continue;
      }

      const isBullet =
        trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ");
      if (isBullet) {
        flushParagraph();
        if (!listEl) {
          listEl = document.createElement("ul");
          listEl.className = "chat-list";
        }
        const li = document.createElement("li");
        appendBoldText(li, trimmed.slice(2).trim());
        listEl.appendChild(li);
      } else {
        flushList();
        paragraphParts.push(trimmed);
      }
    }

    flushParagraph();
    flushList();
    return fragment;
  }

  function addChatBubble(role, text) {
    if (!chatMessages) return;
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role === "user" ? "chat-bubble--user" : "chat-bubble--ai"}`;
    if (role === "user") {
      bubble.textContent = text;
    } else {
      bubble.appendChild(renderChatMessage(text));
    }
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function setChatStatus(message) {
    if (!chatStatus) return;
    chatStatus.textContent = message;
  }

  chatOpen?.addEventListener("click", () => setChatOpen(true));
  chatCloseButtons.forEach((btn) => btn.addEventListener("click", () => setChatOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chatModal?.dataset.open === "true") setChatOpen(false);
  });

  chatSuggestions?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest("[data-chat-suggestion]");
    if (!(button instanceof HTMLElement)) return;
    const suggestion = button.getAttribute("data-chat-suggestion");
    if (!suggestion || !(chatInput instanceof HTMLTextAreaElement)) return;
    chatInput.value = suggestion;
    chatInput.focus();
  });

  chatForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!(chatInput instanceof HTMLTextAreaElement)) return;
    const message = chatInput.value.trim();
    if (!message) return;

    addChatBubble("user", message);
    chatInput.value = "";
    setChatStatus("Thinking…");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Chat is unavailable right now.");
      }
      const data = await res.json();
      const answer = String(data?.answer || "").trim() || "No response.";
      addChatBubble("ai", answer);
      setChatStatus("");
    } catch (err) {
      setChatStatus(err instanceof Error ? err.message : "Failed to reach the AI agent.");
    }
  });

  // Projects (optional JSON file)
  const projectsEl = document.querySelector("[data-projects]");
  async function loadProjects() {
    if (!projectsEl) return;
    try {
      const res = await fetch("/static/data/projects.json", { cache: "no-store" });
      if (!res.ok) return;
      const projects = await res.json();
      if (!Array.isArray(projects) || projects.length === 0) return;

      projectsEl.innerHTML = "";
      for (const project of projects.slice(0, 12)) {
        const title = String(project?.title ?? "").trim();
        const description = String(project?.description ?? "").trim();
        const stack = Array.isArray(project?.stack) ? project.stack : [];
        const link = String(project?.link ?? "").trim();
        const github = String(project?.github ?? "").trim();

        if (!title || !description) continue;

        const linkItems = [];
        if (github) {
          linkItems.push(`
            <a class="card__icon-link" href="${github}" target="_blank" rel="noreferrer" aria-label="View on GitHub">
              <img class="card__icon" src="/static/assets/icons/github.svg" alt="" aria-hidden="true" />
            </a>
          `);
        }
        if (link) {
          linkItems.push(
            `<a class="card__link" href="${link}" target="_blank" rel="noreferrer">View</a>`
          );
        }
        const linkMarkup = linkItems.length
          ? `<div class="card__links">${linkItems.join("")}</div>`
          : "";

        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <div class="card__top">
            <h3 class="card__title"></h3>
            ${linkMarkup}
          </div>
          <p class="muted"></p>
          ${
            stack.length
              ? `<div class="chips">${stack
                  .map((s) => `<span class="chip">${String(s)}</span>`)
                  .join("")}</div>`
              : ""
          }
        `;
        card.querySelector(".card__title").textContent = title;
        card.querySelector("p").textContent = description;
        projectsEl.appendChild(card);
      }
      applyChipIcons(projectsEl);
    } catch {
      // ignore
    }
  }
  loadProjects();

  // Footer social links
  const footerSocial = document.querySelector("[data-footer-social]");
  function buildSocialIcon(label) {
    const key = label.toLowerCase();
    const iconMap = {
      github: "github",
    };
    const slug = iconMap[key];
    if (slug) {
      const img = document.createElement("img");
      img.className = "social-link__img";
      img.src = `/static/assets/icons/${slug}.svg`;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.setAttribute("aria-hidden", "true");
      return img;
    }
    const span = document.createElement("span");
    span.className = "social-link__icon";
    span.textContent = getSocialIconFallback(label);
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  async function loadFooterLinks() {
    if (!footerSocial) return;
    try {
      const res = await fetch("/static/data/links.json", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data?.social) ? data.social : [];
      footerSocial.innerHTML = "";
      for (const item of items) {
        const label = String(item?.label ?? "").trim();
        const url = String(item?.url ?? "").trim();
        if (!label || !url) continue;
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.className = "social-link";
        a.appendChild(buildSocialIcon(label));
        const sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = label;
        a.appendChild(sr);
        footerSocial.appendChild(a);
      }
    } catch {
      // ignore
    }
  }
  loadFooterLinks();

  // Resume link (optional)
  const resumeLink = document.querySelector("[data-resume-link]");
  async function checkResume() {
    if (!(resumeLink instanceof HTMLAnchorElement)) return;
    try {
      const res = await fetch(resumeLink.href, { method: "HEAD" });
      if (!res.ok) resumeLink.remove();
    } catch {
      resumeLink.remove();
    }
  }
  checkResume();

  function getSocialIconFallback(label) {
    const key = label.toLowerCase();
    if (key.includes("linkedin")) {
      return "in";
    }
    if (key.includes("github")) {
      return "GH";
    }
    if (key === "x" || key.includes("twitter")) {
      return "X";
    }
    if (key.includes("portfolio") || key.includes("website")) {
      return "◎";
    }
    return "•";
  }

  // Smooth scroll fallback for older browsers; also respects reduced motion.
  if (!prefersReducedMotion) {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href.length < 2) return;
        const el = document.getElementById(href.slice(1));
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", href);
      });
    });
  }
})();
