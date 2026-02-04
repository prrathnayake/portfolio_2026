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

        if (!title || !description) continue;

        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <div class="card__top">
            <h3 class="card__title"></h3>
            ${link ? `<a class="card__link" href="${link}" target="_blank" rel="noreferrer">View</a>` : ""}
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
    } catch {
      // ignore
    }
  }
  loadProjects();

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
