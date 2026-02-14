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
  const sectionIds = ["home", "contact"];
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
    const delay = Math.min(index * 26, 104);
    el.style.setProperty("--delay", `${delay}ms`);
  });

  function elementInView(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
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
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
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

  // Home text diffusion animation (noise -> denoised text) without changing layout template
  const homeSection = document.getElementById("home");
  if (homeSection instanceof HTMLElement && !prefersReducedMotion) {
    const homeTextTargets = Array.from(
      homeSection.querySelectorAll(
        ".eyebrow, .hero__title, .hero__subtitle, .hero__cta .btn, .hero__meta .meta__k, .hero__meta .meta__v"
      )
    ).filter((el) => el instanceof HTMLElement);

    const noiseAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=";
    const denoiseLayers = [0.04, 0.1, 0.16, 0.24, 0.34, 0.46, 0.58, 0.7, 0.82, 0.92, 1];
    const diffusionStepDelayMs = 145;
    const diffusionInitialDelayMs = 220;
    const diffusionStaggerMs = 140;
    let hasStartedHomeDiffusion = false;

    function isStableGlyph(char) {
      return /\s/.test(char) || "•,.-&()/".includes(char);
    }

    function buildNoisyText(target, revealRatio) {
      return target
        .split("")
        .map((char) => {
          if (isStableGlyph(char)) return char;
          if (Math.random() < revealRatio) return char;
          return noiseAlphabet[Math.floor(Math.random() * noiseAlphabet.length)];
        })
        .join("");
    }

    function runElementDiffusion(element, delayMs) {
      if (!(element instanceof HTMLElement)) return;
      const original = String(element.textContent || "");
      if (!original.trim()) return;

      let layerIndex = 0;
      const renderLayer = () => {
        const revealRatio = denoiseLayers[Math.min(layerIndex, denoiseLayers.length - 1)];
        element.classList.add("home-text-diffusing");
        element.style.setProperty("--clarity", String(revealRatio));
        element.textContent = revealRatio >= 1 ? original : buildNoisyText(original, revealRatio);

        if (layerIndex < denoiseLayers.length - 1) {
          layerIndex += 1;
          window.setTimeout(renderLayer, diffusionStepDelayMs);
          return;
        }

        element.classList.remove("home-text-diffusing");
        element.classList.add("home-text-ready");
        element.style.removeProperty("--clarity");
        element.textContent = original;
      };

      window.setTimeout(renderLayer, delayMs);
    }

    function startHomeDiffusion() {
      if (hasStartedHomeDiffusion) return;
      hasStartedHomeDiffusion = true;
      homeTextTargets.forEach((element, index) => {
        runElementDiffusion(element, diffusionInitialDelayMs + index * diffusionStaggerMs);
      });
    }

    if ("IntersectionObserver" in window) {
      const homeObserver = new IntersectionObserver(
        (entries, obs) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            startHomeDiffusion();
            obs.disconnect();
          }
        },
        { threshold: 0.42 }
      );
      homeObserver.observe(homeSection);
    } else {
      startHomeDiffusion();
    }
  }

  // Chip icons
  const iconMap = {
    "Backend Systems": "generic",
    "Web Development": "generic",
    "Distributed & Event-Driven Architecture": "generic",
    "Event-Driven Architecture": "generic",
    "Automation Workflows": "generic",
    "Secure Coding": "shield",
    "Threat-aware system design": "shield",
    "Prompt Engineering": "generic",
    "Local LLM tooling": "generic",
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

  // Project details modal
  const projectModal = document.querySelector("[data-project-modal]");
  const projectCloseButtons = document.querySelectorAll("[data-project-close]");
  const projectTitleEl = document.querySelector("[data-project-title]");
  const projectSummaryEl = document.querySelector("[data-project-summary]");
  const projectDetailsEl = document.querySelector("[data-project-details]");
  const projectLearningWrapEl = document.querySelector("[data-project-learning-wrap]");
  const projectLearningsEl = document.querySelector("[data-project-learnings]");
  const projectLoadingEl = document.querySelector("[data-project-loading]");
  const projectContentEl = document.querySelector("[data-project-content]");
  let projectLoadToken = 0;

  function setProjectModalOpen(isOpen) {
    if (!(projectModal instanceof HTMLElement)) return;
    projectModal.dataset.open = String(isOpen);
    projectModal.setAttribute("aria-hidden", String(!isOpen));
  }

  function setProjectLoading(isLoading) {
    if (projectLoadingEl instanceof HTMLElement) {
      projectLoadingEl.hidden = !isLoading;
    }
    if (projectContentEl instanceof HTMLElement) {
      projectContentEl.hidden = isLoading;
    }
  }

  function closeProjectModal() {
    projectLoadToken += 1;
    setProjectModalOpen(false);
    setProjectLoading(false);
  }

  function normalizeProjectList(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  function fillProjectList(listEl, items) {
    if (!(listEl instanceof HTMLElement)) return;
    listEl.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listEl.appendChild(li);
    });
  }

  async function openProjectModal({ title, summary, details, learnings }) {
    if (!(projectTitleEl instanceof HTMLElement)) return;
    if (!(projectSummaryEl instanceof HTMLElement)) return;
    if (!(projectDetailsEl instanceof HTMLElement)) return;

    const loadToken = ++projectLoadToken;
    setProjectModalOpen(true);
    setProjectLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    if (loadToken !== projectLoadToken) return;

    const detailItems = normalizeProjectList(details);
    const learningItems = normalizeProjectList(learnings);

    projectTitleEl.textContent = title || "Project details";
    projectSummaryEl.textContent = summary || "Extra project details are loading.";

    const normalizedDetails = detailItems.length > 0 ? detailItems : [summary || "More details coming soon."];
    fillProjectList(projectDetailsEl, normalizedDetails);

    if (projectLearningWrapEl instanceof HTMLElement && projectLearningsEl instanceof HTMLElement) {
      const normalizedLearnings =
        learningItems.length > 0
          ? learningItems
          : ["Learned to turn project goals into clear, testable implementation steps."];
      fillProjectList(projectLearningsEl, normalizedLearnings);
      projectLearningWrapEl.hidden = false;
    }

    setProjectLoading(false);
  }

  projectCloseButtons.forEach((button) =>
    button.addEventListener("click", () => closeProjectModal())
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && projectModal?.dataset.open === "true") {
      closeProjectModal();
    }
  });

  // Bored Killer mini widget
  const boredWidget = document.querySelector("[data-bored-killer]");
  if (boredWidget instanceof HTMLElement) {
    const boredTrigger = boredWidget.querySelector("[data-bored-trigger]");
    const agentPlayground = boredWidget.querySelector("[data-agent-playground]");
    const agentPlaygroundTrigger = boredWidget.querySelector("[data-agent-playground-trigger]");
    const agentPlaygroundMenu = boredWidget.querySelector("[data-agent-playground-menu]");
    const agentActionButtons = Array.from(boredWidget.querySelectorAll("[data-agent-action]"));
    const boredPanel = boredWidget.querySelector("#bored-killer-panel");
    const boredClose = boredWidget.querySelector("[data-bored-close]");
    const boredSteps = Array.from(boredWidget.querySelectorAll("[data-bored-step]"));
    const boredStepLabel = boredWidget.querySelector("[data-bored-step-label]");
    const boredAnswerButtons = Array.from(boredWidget.querySelectorAll("[data-bored-answer]"));
    const boredCategoryButtons = Array.from(boredWidget.querySelectorAll("[data-bored-category]"));
    const boredCategoriesBack = boredWidget.querySelector("[data-bored-categories-back]");
    const boredLoading = boredWidget.querySelector("[data-bored-loading]");
    const boredResult = boredWidget.querySelector("[data-bored-result]");
    const boredRestart = boredWidget.querySelector("[data-bored-restart]");
    const boredBack = boredWidget.querySelector("[data-bored-back]");
    const boredStatus = boredWidget.querySelector("[data-bored-status]");
    const boredWordButtons = Array.from(boredWidget.querySelectorAll("[data-bored-word]"));
    const boredStepTitles = {
      prompt: "Question 1 of 2",
      categories: "Question 2 of 2",
    };

    let selectedBoredCategory =
      boredCategoryButtons[0]?.getAttribute("data-category") || "Backend engineering";
    let boredBackStep = "categories";
    let boredRequestToken = 0;
    let boredMenuIndex = -1;
    let boredAudioContext = null;
    let lastHoverSoundAt = 0;

    function getBoredAudioContext() {
      if (boredAudioContext) return boredAudioContext;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      boredAudioContext = new AudioCtx();
      return boredAudioContext;
    }

    function playBoredMenuSound(kind) {
      const nowMs = performance.now();
      if (kind === "hover" && nowMs - lastHoverSoundAt < 80) return;

      const ctx = getBoredAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        filter.type = "bandpass";
        osc.type = kind === "hover" ? "triangle" : "square";
        if (kind === "hover") {
          filter.frequency.setValueAtTime(760, now);
          osc.frequency.setValueAtTime(610, now);
          osc.frequency.exponentialRampToValueAtTime(890, now + 0.05);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.014, now + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
          lastHoverSoundAt = nowMs;
        } else {
          filter.frequency.setValueAtTime(560, now);
          osc.frequency.setValueAtTime(250, now);
          osc.frequency.exponentialRampToValueAtTime(430, now + 0.08);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.03, now + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        }

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + (kind === "hover" ? 0.08 : 0.13));
      } catch {
        // ignore audio errors
      }
    }

    function setBoredStatus(message) {
      if (!(boredStatus instanceof HTMLElement)) return;
      boredStatus.textContent = message;
      resizeBoredPanel({ immediate: true });
    }

    function setBoredLoading(isLoading) {
      boredWidget.classList.toggle("is-generating", isLoading);
      if (boredLoading instanceof HTMLElement) {
        boredLoading.hidden = !isLoading;
      }
      if (boredCategoriesBack instanceof HTMLButtonElement) {
        boredCategoriesBack.disabled = isLoading;
      }
      boredCategoryButtons.forEach((button) => {
        if (button instanceof HTMLButtonElement) {
          button.disabled = isLoading;
        }
      });
      resizeBoredPanel({ immediate: true });
    }

    function setAgentPlaygroundOpen(isOpen) {
      if (!(agentPlayground instanceof HTMLElement)) return;
      agentPlayground.dataset.open = String(isOpen);
      if (agentPlaygroundTrigger instanceof HTMLButtonElement) {
        agentPlaygroundTrigger.setAttribute("aria-expanded", String(isOpen));
      }
      if (agentPlaygroundMenu instanceof HTMLElement) {
        agentPlaygroundMenu.setAttribute("aria-hidden", String(!isOpen));
      }
    }

    function setOptionSelection(buttons, selectedButton) {
      buttons.forEach((button) => {
        const isSelected = button === selectedButton;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-checked", String(isSelected));
      });
    }

    function getActiveBoredWords() {
      const activeStep = boredSteps.find((step) => !step.hidden);
      if (!(activeStep instanceof HTMLElement)) return [];
      return Array.from(activeStep.querySelectorAll("[data-bored-word]")).filter(
        (el) => el instanceof HTMLButtonElement && !el.disabled
      );
    }

    function setBoredMenuSelection(index, { focus = false, playSound = false } = {}) {
      const activeWords = getActiveBoredWords();
      if (index < 0 || activeWords.length === 0) {
        boredWordButtons.forEach((word) => {
          word.classList.remove("is-menu-selected");
          word.setAttribute("tabindex", "-1");
        });
        boredMenuIndex = -1;
        return;
      }

      const normalizedIndex = ((index % activeWords.length) + activeWords.length) % activeWords.length;
      boredWordButtons.forEach((word) => {
        word.classList.remove("is-menu-selected");
        word.setAttribute("tabindex", "-1");
      });
      const selectedWord = activeWords[normalizedIndex];
      selectedWord.classList.add("is-menu-selected");
      selectedWord.setAttribute("tabindex", "0");
      boredMenuIndex = normalizedIndex;

      if (focus) {
        selectedWord.focus({ preventScroll: true });
      }
      if (playSound) {
        playBoredMenuSound("hover");
      }
    }

    function syncBoredMenuSelectionFromWord(word, { playSound = false } = {}) {
      if (!(word instanceof HTMLButtonElement)) return;
      const activeWords = getActiveBoredWords();
      const index = activeWords.indexOf(word);
      if (index < 0) return;
      setBoredMenuSelection(index, { focus: false, playSound });
    }

    function setBoredInitialMenuSelection({ focus = false } = {}) {
      const activeWords = getActiveBoredWords();
      if (activeWords.length === 0) {
        setBoredMenuSelection(-1);
        return;
      }
      if (!focus) {
        setBoredMenuSelection(-1);
        return;
      }
      const selectedIndex = activeWords.findIndex((word) => word.classList.contains("is-selected"));
      const preferredIndex = selectedIndex >= 0 ? selectedIndex : 0;
      setBoredMenuSelection(preferredIndex, { focus, playSound: false });
    }

    function setBoredCategory(selectedButton) {
      if (!(selectedButton instanceof HTMLButtonElement)) return;
      const category = selectedButton.getAttribute("data-category");
      if (!category) return;
      selectedBoredCategory = category;
      setOptionSelection(boredCategoryButtons, selectedButton);
    }

    function applyBoredResultSize(text) {
      if (!(boredResult instanceof HTMLElement)) return;
      boredResult.classList.remove("is-medium", "is-long", "is-xlong");
      const length = text.trim().length;
      if (length > 320) {
        boredResult.classList.add("is-xlong");
        return;
      }
      if (length > 220) {
        boredResult.classList.add("is-long");
        return;
      }
      if (length > 120) {
        boredResult.classList.add("is-medium");
      }
      resizeBoredPanel({ immediate: true });
    }

    function resizeBoredPanel({ immediate = false } = {}) {
      if (!(boredPanel instanceof HTMLElement)) return;
      if (boredWidget.dataset.open !== "true") {
        boredPanel.style.height = "";
        return;
      }

      const update = () => {
        boredPanel.style.height = "auto";
        const naturalHeight = boredPanel.scrollHeight;
        const maxHeight = Math.max(320, window.innerHeight - 28);
        const minHeight = Math.min(maxHeight, 320);
        const targetHeight = Math.min(maxHeight, Math.max(minHeight, naturalHeight));
        boredPanel.style.height = `${Math.round(targetHeight)}px`;
      };

      if (immediate || prefersReducedMotion) {
        update();
      } else {
        requestAnimationFrame(update);
      }
    }

    function showBoredStep(stepName, { animate = true } = {}) {
      const nextStep = boredSteps.find((step) => step.getAttribute("data-bored-step") === stepName);
      if (!(nextStep instanceof HTMLElement)) return;

      boredSteps.forEach((step) => {
        const isTarget = step === nextStep;
        step.hidden = !isTarget;
        if (!isTarget) {
          step.classList.remove("is-spawning");
        }
      });

      if (boredWidget instanceof HTMLElement) {
        boredWidget.dataset.step = stepName;
      }

      const stepLabel = boredStepTitles[stepName] || "";
      if (boredStepLabel instanceof HTMLElement) {
        boredStepLabel.textContent = stepLabel;
        boredStepLabel.hidden = !stepLabel;
      }

      if (animate && !prefersReducedMotion) {
        nextStep.classList.remove("is-spawning");
        // Reflow to restart the entry animation each time the next question appears.
        void nextStep.offsetWidth;
        nextStep.classList.add("is-spawning");
        nextStep.addEventListener(
          "animationend",
          () => {
            nextStep.classList.remove("is-spawning");
          },
          { once: true }
        );
      }

      setBoredInitialMenuSelection({ focus: false });
      resizeBoredPanel({ immediate: true });
    }

    function resetBoredFlow({ animate = false } = {}) {
      setBoredStatus("");
      setBoredLoading(false);
      if (boredResult instanceof HTMLElement) {
        boredResult.textContent = "";
      }
      applyBoredResultSize("");
      if (boredCategoryButtons[0] instanceof HTMLButtonElement) {
        setBoredCategory(boredCategoryButtons[0]);
      }
      boredBackStep = "categories";
      showBoredStep("prompt", { animate });
      setBoredInitialMenuSelection({ focus: false });
    }

    function setBoredOpen(isOpen) {
      const wasOpen = boredWidget.dataset.open === "true";
      if (wasOpen === isOpen) return;

      setAgentPlaygroundOpen(false);
      boredWidget.dataset.open = String(isOpen);
      if (boredTrigger instanceof HTMLButtonElement) {
        boredTrigger.setAttribute("aria-expanded", String(isOpen));
      }
      if (boredPanel instanceof HTMLElement) {
        boredPanel.setAttribute("aria-hidden", String(!isOpen));
      }

      if (isOpen) {
        resetBoredFlow({ animate: true });
        setTimeout(() => {
          setBoredInitialMenuSelection({ focus: true });
          resizeBoredPanel({ immediate: true });
        }, 50);
        return;
      }

      // Cancel any in-flight fun-fact response when panel closes.
      boredRequestToken += 1;
      setBoredLoading(false);
      setBoredStatus("");
      setBoredMenuSelection(-1);
      boredPanel.style.height = "";
    }

    async function generateBoredFact() {
      if (!selectedBoredCategory) return;
      setBoredStatus("");
      setBoredLoading(true);
      const requestToken = ++boredRequestToken;

      try {
        showBoredStep("categories", { animate: false });
        const res = await fetch("/api/bored-fact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: selectedBoredCategory,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail || "Fun facts are unavailable right now.");
        }
        const data = await res.json();
        if (requestToken !== boredRequestToken) return;

        const answer = String(data?.answer || "").trim();
        if (boredResult instanceof HTMLElement) {
          boredResult.textContent = answer || "Pasan keeps building cool things across backend and AI.";
          applyBoredResultSize(boredResult.textContent);
        }
        boredBackStep = "categories";
        showBoredStep("result", { animate: true });
      } catch (err) {
        if (requestToken !== boredRequestToken) return;
        setBoredStatus(
          err instanceof Error ? err.message : "Could not generate a fun fact right now."
        );
      } finally {
        if (requestToken === boredRequestToken) {
          setBoredLoading(false);
        }
      }
    }

    resetBoredFlow({ animate: false });

    boredWordButtons.forEach((word, index) => {
      if (!(word instanceof HTMLElement)) return;
      word.style.setProperty("--float-delay", `${(index % 7) * 120}ms`);
      word.setAttribute("tabindex", "-1");
      word.addEventListener("pointerenter", () => {
        syncBoredMenuSelectionFromWord(word, { playSound: true });
      });
      word.addEventListener("focus", () => {
        syncBoredMenuSelectionFromWord(word, { playSound: true });
      });
      word.addEventListener("click", () => playBoredMenuSound("select"));
    });

    boredTrigger?.addEventListener("click", () => {
      setBoredOpen(true);
    });

    agentPlaygroundTrigger?.addEventListener("click", () => {
      const isOpen = agentPlayground instanceof HTMLElement && agentPlayground.dataset.open === "true";
      setAgentPlaygroundOpen(!isOpen);
    });

    agentActionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (!(button instanceof HTMLElement)) return;
        const action = button.getAttribute("data-agent-action");
        setAgentPlaygroundOpen(false);
        if (action === "chat") {
          setBoredOpen(false);
          setChatOpen(true);
          return;
        }
        if (action === "bored") {
          setChatOpen(false);
          setBoredOpen(true);
        }
      });
    });

    boredClose?.addEventListener("click", () => setBoredOpen(false));

    boredAnswerButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const answer = button.getAttribute("data-bored-answer");
        setBoredStatus("");
        if (answer === "yes") {
          showBoredStep("categories", { animate: true });
          return;
        }
        if (boredResult instanceof HTMLElement) {
          boredResult.textContent = 'No problem. Click "Another fact" whenever boredom wins.';
          applyBoredResultSize(boredResult.textContent);
        }
        boredBackStep = "prompt";
        showBoredStep("result", { animate: true });
      });
    });

    boredCategoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setBoredCategory(button);
        generateBoredFact();
      });
    });

    boredCategoriesBack?.addEventListener("click", () => {
      showBoredStep("prompt", { animate: true });
      setBoredStatus("");
    });

    boredRestart?.addEventListener("click", () => {
      showBoredStep("categories", { animate: true });
      setBoredStatus("");
    });
    boredBack?.addEventListener("click", () => {
      showBoredStep(boredBackStep, { animate: true });
      setBoredStatus("");
    });

    document.addEventListener("click", (event) => {
      if (agentPlayground instanceof HTMLElement && agentPlayground.dataset.open === "true") {
        const target = event.target;
        if (target instanceof Node && !agentPlayground.contains(target)) {
          setAgentPlaygroundOpen(false);
        }
      }

      if (boredWidget.dataset.open !== "true") return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (boredWidget.contains(target)) return;
      setBoredOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && agentPlayground instanceof HTMLElement && agentPlayground.dataset.open === "true") {
        setAgentPlaygroundOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (boredWidget.dataset.open !== "true") return;

      if (event.key === "Escape") {
        setBoredOpen(false);
        return;
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        const delta = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
        setBoredMenuSelection(boredMenuIndex + delta, { focus: true, playSound: true });
        return;
      }

      if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
        const activeWords = getActiveBoredWords();
        if (activeWords.length === 0) return;
        const word = activeWords[Math.max(0, boredMenuIndex)];
        if (!(word instanceof HTMLButtonElement)) return;
        event.preventDefault();
        word.click();
      }
    });

    window.addEventListener("resize", () => {
      if (boredWidget.dataset.open === "true") {
        resizeBoredPanel({ immediate: true });
      }
    });
  }

  // Projects (optional JSON file)
  const projectsEl = document.querySelector("[data-projects]");

  function openProjectFromButton(infoButton) {
    if (!(infoButton instanceof HTMLButtonElement)) return;
    const title = String(infoButton.dataset.projectTitle ?? "").trim();
    const summary = String(infoButton.dataset.projectSummary ?? "").trim();
    let details = [];
    let learnings = [];
    const rawDetails = infoButton.dataset.projectDetails;
    const rawLearnings = infoButton.dataset.projectLearnings;
    if (rawDetails) {
      try {
        const parsed = JSON.parse(rawDetails);
        if (Array.isArray(parsed)) details = parsed;
      } catch {
        details = [];
      }
    }
    if (rawLearnings) {
      try {
        const parsed = JSON.parse(rawLearnings);
        if (Array.isArray(parsed)) learnings = parsed;
      } catch {
        learnings = [];
      }
    }

    void openProjectModal({ title, summary, details, learnings });
  }

  projectsEl?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const infoButton = target.closest("[data-project-info]");
    if (!(infoButton instanceof HTMLButtonElement)) return;
    openProjectFromButton(infoButton);
  });

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
        const details = Array.isArray(project?.details)
          ? project.details
              .map((item) => String(item ?? "").trim())
              .filter(Boolean)
          : [];
        const learnings = Array.isArray(project?.learnings)
          ? project.learnings
              .map((item) => String(item ?? "").trim())
              .filter(Boolean)
          : [];

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
        card.className = "card card--project";
        card.innerHTML = `
          <div class="card__top">
            <h3 class="card__title"></h3>
            ${linkMarkup}
          </div>
          <p class="muted card__description"></p>
          ${
            stack.length
              ? `<div class="chips">${stack
                  .map((s) => `<span class="chip">${String(s)}</span>`)
                  .join("")}</div>`
              : ""
          }
          <div class="card__footer">
            <button class="card__icon-link card__info-link" type="button" data-project-info>
              <svg class="card__icon" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="9" fill="currentColor"></circle>
                <circle cx="12" cy="7.8" r="1.05" fill="#050505"></circle>
                <path d="M12 10.8v5.3" fill="none" stroke="#050505" stroke-width="1.8" stroke-linecap="round"></path>
              </svg>
            </button>
          </div>
        `;
        card.querySelector(".card__title").textContent = title;
        card.querySelector(".card__description").textContent = description;
        const infoButton = card.querySelector("[data-project-info]");
        if (infoButton instanceof HTMLButtonElement) {
          infoButton.setAttribute("aria-label", `More details about ${title}`);
          infoButton.dataset.projectTitle = title;
          infoButton.dataset.projectSummary = description;
          infoButton.dataset.projectDetails = JSON.stringify(details);
          infoButton.dataset.projectLearnings = JSON.stringify(learnings);
          infoButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openProjectFromButton(infoButton);
          });
        }
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
