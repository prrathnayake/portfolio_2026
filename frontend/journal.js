(() => {
  const feedEl = document.querySelector("[data-journal-feed]");
  const tagsEl = document.querySelector("[data-journal-tags]");
  const searchInput = document.querySelector("[data-journal-search]");
  const statusEl = document.querySelector("[data-journal-status]");

  if (!(feedEl instanceof HTMLElement)) return;
  if (!(tagsEl instanceof HTMLElement)) return;

  const likesStorageKey = "portfolio_journal_likes_v1";
  const savedStorageKey = "portfolio_journal_saved_v1";
  const formatter = new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  let posts = [];
  let selectedTag = "All";
  let searchTerm = "";
  let likedIds = readIdSet(likesStorageKey);
  let savedIds = readIdSet(savedStorageKey);

  function readIdSet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.map((item) => String(item ?? "").trim()).filter(Boolean));
    } catch {
      return new Set();
    }
  }

  function writeIdSet(key, set) {
    const values = Array.from(set);
    localStorage.setItem(key, JSON.stringify(values));
  }

  function setStatus(message) {
    if (!(statusEl instanceof HTMLElement)) return;
    statusEl.textContent = message;
  }

  function toDisplayDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || "";
    return formatter.format(date);
  }

  function normalizePost(post, index) {
    const id = String(post?.id ?? "").trim() || `journal-post-${index + 1}`;
    const title = String(post?.title ?? "").trim();
    const summary = String(post?.summary ?? "").trim();
    const createdAt = String(post?.createdAt ?? "").trim();
    const readTime = String(post?.readTime ?? "").trim();
    const mood = String(post?.mood ?? "").trim();
    const tags = Array.isArray(post?.tags)
      ? post.tags.map((tag) => String(tag ?? "").trim()).filter(Boolean)
      : [];
    const points = Array.isArray(post?.points)
      ? post.points.map((point) => String(point ?? "").trim()).filter(Boolean)
      : [];
    const baseLikes = Number.isFinite(post?.baseLikes)
      ? Number(post.baseLikes)
      : Number.parseInt(String(post?.baseLikes ?? "0"), 10) || 0;
    return { id, title, summary, createdAt, readTime, mood, tags, points, baseLikes };
  }

  function sortedPosts(items) {
    return items.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return bTime - aTime;
    });
  }

  function collectTags(items) {
    const bucket = new Set();
    items.forEach((post) => {
      post.tags.forEach((tag) => bucket.add(tag));
    });
    return ["All", ...Array.from(bucket).sort((a, b) => a.localeCompare(b))];
  }

  function matchesSearch(post, query) {
    if (!query) return true;
    const haystack = [
      post.title,
      post.summary,
      post.mood,
      post.tags.join(" "),
      post.points.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  function getFilteredPosts() {
    const query = searchTerm.trim().toLowerCase();
    return posts.filter((post) => {
      const tagMatch = selectedTag === "All" || post.tags.includes(selectedTag);
      return tagMatch && matchesSearch(post, query);
    });
  }

  function buildTagFilters() {
    const tags = collectTags(posts);
    tagsEl.innerHTML = "";
    for (const tag of tags) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chip journal-tag${tag === selectedTag ? " is-active" : ""}`;
      button.textContent = tag;
      button.setAttribute("data-journal-tag", tag);
      button.setAttribute("aria-pressed", String(tag === selectedTag));
      tagsEl.appendChild(button);
    }
  }

  function buildActionButton({ action, postId, text, active = false }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `journal-action${active ? " is-active" : ""}`;
    button.dataset.journalAction = action;
    button.dataset.postId = postId;
    button.textContent = text;
    return button;
  }

  function buildPostCard(post) {
    const article = document.createElement("article");
    article.className = "card journal-post";
    article.id = `post-${post.id}`;

    const head = document.createElement("div");
    head.className = "journal-post__head";

    const title = document.createElement("h2");
    title.className = "journal-post__title";
    title.textContent = post.title;

    const meta = document.createElement("div");
    meta.className = "journal-post__meta";
    const date = document.createElement("span");
    date.className = "tag";
    date.textContent = toDisplayDate(post.createdAt);
    meta.appendChild(date);

    if (post.readTime) {
      const read = document.createElement("span");
      read.className = "tag";
      read.textContent = post.readTime;
      meta.appendChild(read);
    }
    if (post.mood) {
      const mood = document.createElement("span");
      mood.className = "tag";
      mood.textContent = post.mood;
      meta.appendChild(mood);
    }

    head.append(title, meta);
    article.appendChild(head);

    if (post.summary) {
      const summary = document.createElement("p");
      summary.className = "journal-post__summary";
      summary.textContent = post.summary;
      article.appendChild(summary);
    }

    if (post.points.length > 0) {
      const list = document.createElement("ul");
      list.className = "journal-post__points";
      post.points.forEach((point) => {
        const li = document.createElement("li");
        li.textContent = point;
        list.appendChild(li);
      });
      article.appendChild(list);
    }

    if (post.tags.length > 0) {
      const tagWrap = document.createElement("div");
      tagWrap.className = "chips journal-post__tags";
      post.tags.forEach((tagText) => {
        const tag = document.createElement("span");
        tag.className = "chip";
        tag.textContent = tagText;
        tagWrap.appendChild(tag);
      });
      article.appendChild(tagWrap);
    }

    const actions = document.createElement("div");
    actions.className = "journal-post__actions";

    const liked = likedIds.has(post.id);
    const saved = savedIds.has(post.id);
    const likeCount = post.baseLikes + (liked ? 1 : 0);

    actions.appendChild(
      buildActionButton({
        action: "like",
        postId: post.id,
        text: `♥ Like ${likeCount}`,
        active: liked,
      })
    );
    actions.appendChild(
      buildActionButton({
        action: "save",
        postId: post.id,
        text: saved ? "✓ Saved" : "Save",
        active: saved,
      })
    );
    actions.appendChild(
      buildActionButton({
        action: "share",
        postId: post.id,
        text: "Share",
      })
    );

    article.appendChild(actions);
    return article;
  }

  function renderPosts() {
    const visible = getFilteredPosts();
    feedEl.innerHTML = "";

    if (visible.length === 0) {
      const emptyCard = document.createElement("article");
      emptyCard.className = "card journal-empty";
      const title = document.createElement("h3");
      title.textContent = "No journal posts found";
      const copy = document.createElement("p");
      copy.className = "muted";
      copy.textContent = "Try another keyword or choose a different topic.";
      emptyCard.append(title, copy);
      feedEl.appendChild(emptyCard);
      return;
    }

    visible.forEach((post) => {
      feedEl.appendChild(buildPostCard(post));
    });
  }

  function flashPostFromHash() {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (!(target instanceof HTMLElement)) return;
    target.classList.add("journal-post--focus");
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => target.classList.remove("journal-post--focus"), 1800);
  }

  async function sharePost(postId) {
    const shareUrl = `${window.location.origin}/journal#post-${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Post link copied to clipboard.");
    } catch {
      setStatus(`Copy this link: ${shareUrl}`);
    }
  }

  function handleTagClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest("[data-journal-tag]");
    if (!(button instanceof HTMLButtonElement)) return;
    selectedTag = String(button.dataset.journalTag || "All");
    buildTagFilters();
    renderPosts();
  }

  async function handlePostAction(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest("[data-journal-action]");
    if (!(button instanceof HTMLButtonElement)) return;

    const action = String(button.dataset.journalAction || "");
    const postId = String(button.dataset.postId || "");
    if (!postId || !action) return;

    if (action === "like") {
      if (likedIds.has(postId)) likedIds.delete(postId);
      else likedIds.add(postId);
      writeIdSet(likesStorageKey, likedIds);
      renderPosts();
      return;
    }

    if (action === "save") {
      if (savedIds.has(postId)) savedIds.delete(postId);
      else savedIds.add(postId);
      writeIdSet(savedStorageKey, savedIds);
      renderPosts();
      return;
    }

    if (action === "share") {
      await sharePost(postId);
    }
  }

  async function loadPosts() {
    setStatus("Loading journal posts...");
    try {
      const response = await fetch("/static/data/journal_posts.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load journal posts.");
      }
      const payload = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error("Invalid journal data.");
      }
      posts = sortedPosts(payload.map(normalizePost).filter((post) => post.title && post.id));
      buildTagFilters();
      renderPosts();
      setStatus(`${posts.length} posts available.`);
      flashPostFromHash();
    } catch (error) {
      posts = [];
      buildTagFilters();
      renderPosts();
      const message = error instanceof Error ? error.message : "Failed to load posts.";
      setStatus(message);
    }
  }

  tagsEl.addEventListener("click", handleTagClick);
  feedEl.addEventListener("click", (event) => {
    void handlePostAction(event);
  });

  if (searchInput instanceof HTMLInputElement) {
    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value || "";
      renderPosts();
    });
  }

  window.addEventListener("hashchange", flashPostFromHash);
  void loadPosts();
})();
