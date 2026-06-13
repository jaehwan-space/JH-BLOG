(() => {
  const STORAGE_KEY = "jh_blog_state_v1";
  const SESSION_KEY = "jh_blog_admin_session";
  const ADMIN = { id: "jh_admin", password: "jh_blog" };
  const ICONS = {
    admin: "assets/icon-admin.svg",
    blog: "assets/icon-blog.svg",
    comment: "assets/icon-comment.svg",
    dev: "assets/icon-dev.svg",
    markdown: "assets/icon-markdown.svg",
    search: "assets/icon-search.svg",
    stats: "assets/icon-stats.svg",
    til: "assets/icon-til.svg",
    retro: "assets/icon-retro.svg",
  };

  const app = document.querySelector("#app");

  const seedPosts = [
    {
      id: "post-admin-ux",
      title: "혼자 운영하는 블로그를 위한 관리자 경험 설계",
      excerpt:
        "글쓰기, 댓글, 통계를 한 사람이 부담 없이 관리할 수 있도록 화면 흐름을 정리합니다.",
      category: "개발",
      tags: ["Admin UX", "Designbase", "개인블로그"],
      status: "published",
      cover: "admin",
      createdAt: "2026-06-12T09:00:00.000Z",
      updatedAt: "2026-06-12T09:00:00.000Z",
      views: 1284,
      content: `# 혼자 운영하는 블로그를 위한 관리자 경험 설계

개인 블로그의 관리 화면은 많은 기능을 한 번에 보여주기보다, 오늘 처리해야 할 일과 최근 반응을 빠르게 확인하게 만드는 것이 중요합니다.

## 관리자가 자주 보는 정보

조회수, 발행된 글 수, 승인 대기 댓글, 인기 글은 대시보드 첫 화면에서 바로 읽혀야 합니다. 색은 상태를 구분할 때만 사용하고, 대부분의 위계는 간격과 타이포그래피로 만듭니다.

## 작성 흐름

글 작성기는 PC에서 마크다운과 미리보기를 나란히 보여주고, 모바일에서는 작성과 미리보기를 탭으로 전환합니다.

\`\`\`js
const post = await getPost(slug);
return renderArticle(post, comments);
\`\`\`

## 다음 작업

초안 저장, 댓글 승인, 조회수 확인이 한 화면에서 자연스럽게 이어지면 혼자 운영하는 블로그도 훨씬 가벼워집니다.`,
    },
    {
      id: "post-markdown-editor",
      title: "마크다운 에디터에서 미리보기 품질 높이기",
      excerpt:
        "작성 중에도 실제 글 상세 화면과 비슷하게 읽히도록 에디터와 프리뷰의 리듬을 맞춥니다.",
      category: "TIL",
      tags: ["Markdown", "Editor", "Preview"],
      status: "published",
      cover: "markdown",
      createdAt: "2026-06-10T08:30:00.000Z",
      updatedAt: "2026-06-10T08:30:00.000Z",
      views: 764,
      content: `# 마크다운 에디터에서 미리보기 품질 높이기

좋은 작성기는 입력하는 동안 결과를 상상하게 만들지 않습니다. 미리보기가 실제 글 상세 화면과 가까울수록 수정 판단이 빨라집니다.

## 데스크톱

- 왼쪽은 마크다운 작성
- 오른쪽은 미리보기
- 상단 툴바와 발행 버튼은 고정

## 모바일

모바일에서는 두 패널을 억지로 나란히 놓지 않고, 작성과 미리보기를 탭으로 전환합니다.`,
    },
    {
      id: "post-comment-flow",
      title: "댓글 승인 흐름을 너무 무겁지 않게 만들기",
      excerpt:
        "개인 블로그의 댓글은 빠르게 확인하고 승인할 수 있는 정도면 충분합니다.",
      category: "회고",
      tags: ["댓글", "운영", "UX"],
      status: "published",
      cover: "comment",
      createdAt: "2026-06-08T11:00:00.000Z",
      updatedAt: "2026-06-08T11:00:00.000Z",
      views: 512,
      content: `# 댓글 승인 흐름을 너무 무겁지 않게 만들기

혼자 쓰는 블로그에 복잡한 커뮤니티 관리 도구는 필요하지 않습니다. 최근 댓글, 승인 대기, 삭제 기능이 명확하면 충분합니다.

## 원칙

댓글은 글을 읽는 흐름을 방해하지 않아야 합니다. 입력은 간단하게, 관리는 대시보드에서 빠르게 처리합니다.`,
    },
  ];

  const seedComments = [
    {
      id: "comment-1",
      postId: "post-admin-ux",
      author: "민수",
      body: "대시보드 구성이 깔끔해서 참고가 됩니다.",
      status: "published",
      createdAt: "2026-06-12T10:00:00.000Z",
    },
    {
      id: "comment-2",
      postId: "post-admin-ux",
      author: "수연",
      body: "모바일 작성 탭 흐름도 궁금해요.",
      status: "pending",
      createdAt: "2026-06-12T10:20:00.000Z",
    },
    {
      id: "comment-3",
      postId: "post-markdown-editor",
      author: "JH",
      body: "미리보기 타이포그래피까지 맞추는 게 핵심이더라고요.",
      status: "published",
      createdAt: "2026-06-10T12:00:00.000Z",
    },
  ];

  let state = loadState();
  let ui = {
    query: "",
    category: "전체",
    editorMode: "write",
  };
  let lastRouteKey = "";

  function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    const seeded = { posts: seedPosts, comments: seedComments };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function isAuthed() {
    return localStorage.getItem(SESSION_KEY) === "true";
  }

  function setAuthed(value) {
    if (value) localStorage.setItem(SESSION_KEY, "true");
    else localStorage.removeItem(SESSION_KEY);
  }

  function localPasswordHash(value = "") {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function getPublishedPosts() {
    return state.posts
      .filter((post) => post.status === "published")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getPost(id) {
    return state.posts.find((post) => post.id === id);
  }

  function getCategories() {
    return ["전체", ...new Set(state.posts.map((post) => post.category))];
  }

  function getAllTags() {
    return [...new Set(state.posts.flatMap((post) => post.tags))].sort();
  }

  function getVisualKey(post) {
    const source = [
      post.cover,
      post.category,
      ...(post.tags || []),
      post.title,
    ]
      .join(" ")
      .toLowerCase();

    if (source.includes("admin") || source.includes("관리자")) return "admin";
    if (source.includes("markdown") || source.includes("마크다운")) return "markdown";
    if (source.includes("comment") || source.includes("댓글")) return "comment";
    if (source.includes("til")) return "til";
    if (source.includes("회고")) return "retro";
    if (source.includes("통계") || source.includes("stats")) return "stats";
    if (source.includes("검색") || source.includes("search")) return "search";
    if (source.includes("개발") || source.includes("dev")) return "dev";
    return "blog";
  }

  function renderIcon(key, className = "", alt = "") {
    const icon = ICONS[key] || ICONS.blog;
    return `<img class="${className}" src="${icon}" alt="${escapeHtml(alt)}" loading="lazy" />`;
  }

  function readingMinutes(post) {
    const words = post.content.replace(/[^\w가-힣]+/g, " ").trim().split(/\s+/);
    return Math.max(1, Math.ceil(words.length / 180));
  }

  function renderVisualCover(post, size = "card") {
    const key = getVisualKey(post);
    return `
      <span class="visual-cover ${size} visual-${key}" aria-hidden="true">
        ${renderIcon(key, "visual-cover-icon", "")}
      </span>
    `;
  }

  function postComments(postId, includePending = false) {
    return state.comments
      .filter(
        (comment) =>
          comment.postId === postId &&
          (includePending || comment.status === "published"),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function inlineMarkdown(value) {
    let html = escapeHtml(value);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
    return html;
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/[^\w가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function renderMarkdown(markdown = "") {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const chunks = [];
    let inCode = false;
    let codeBuffer = [];
    let inList = false;
    let paragraph = [];

    function flushParagraph() {
      if (paragraph.length) {
        chunks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
        paragraph = [];
      }
    }

    function closeList() {
      if (inList) {
        chunks.push("</ul>");
        inList = false;
      }
    }

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        if (!inCode) {
          flushParagraph();
          closeList();
          inCode = true;
          codeBuffer = [];
        } else {
          chunks.push(
            `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`,
          );
          inCode = false;
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        closeList();
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        closeList();
        const level = heading[1].length;
        const text = heading[2].trim();
        const id = slugify(text);
        chunks.push(
          `<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`,
        );
        continue;
      }

      const list = line.match(/^-\s+(.+)$/);
      if (list) {
        flushParagraph();
        if (!inList) {
          chunks.push("<ul>");
          inList = true;
        }
        chunks.push(`<li>${inlineMarkdown(list[1])}</li>`);
        continue;
      }

      const quote = line.match(/^>\s+(.+)$/);
      if (quote) {
        flushParagraph();
        closeList();
        chunks.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
        continue;
      }

      paragraph.push(line.trim());
    }

    flushParagraph();
    closeList();

    if (inCode) {
      chunks.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
    }

    return chunks.join("");
  }

  function contentWithoutDuplicateTitle(content = "", title = "") {
    const lines = content.replace(/\r\n/g, "\n").split("\n");
    const firstTextLine = lines.findIndex((line) => line.trim());
    if (firstTextLine === -1) return content;

    const firstLine = lines[firstTextLine].trim();
    const normalizedTitle = title.trim();
    if (firstLine === `# ${normalizedTitle}`) {
      lines.splice(firstTextLine, 1);
      return lines.join("\n").trimStart();
    }

    return content;
  }

  function getToc(markdown = "") {
    return markdown
      .split("\n")
      .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
      .filter(Boolean)
      .map((match) => ({
        id: slugify(match[2]),
        label: match[2].trim(),
        level: match[1].length,
      }));
  }

  function iconLabel(label) {
    return `<span class="brand-mark" aria-hidden="true">${label}</span>`;
  }

  function publicHeader(active = "home", progress = 0) {
    return `
      <header class="public-header" data-public-header>
        <div class="header-inner">
          <a href="#/" class="brand">${iconLabel("JH")}<span>JH_BLOG</span></a>
          <nav class="nav" aria-label="주요 메뉴">
            <a class="nav-link ${active === "home" ? "active" : ""}" href="#/">홈</a>
            <a class="nav-link" href="#/?category=개발">카테고리</a>
            <a class="nav-link" href="#/">아카이브</a>
            <a class="nav-link" href="#/">소개</a>
          </nav>
          <div class="header-tools">
            <a class="button ghost" href="#/admin/login">관리자</a>
          </div>
        </div>
        <div class="progress" aria-hidden="true">
          <div class="progress-bar" data-progress-bar style="width: ${progress}%"></div>
        </div>
      </header>
    `;
  }

  function layoutPublic(content, active = "home") {
    return `<div class="app">${publicHeader(active)}<main>${content}</main></div>`;
  }

  function adminLayout(title, subtitle, active, content, cta = "") {
    return `
      <div class="admin-shell app">
        <aside class="admin-sidebar">
          <a href="#/admin" class="brand">${iconLabel("JH")}<span>JH_BLOG</span></a>
          <nav class="admin-nav" aria-label="관리자 메뉴">
            ${adminLink("#/admin", "대시보드", active === "dashboard")}
            ${adminLink("#/admin/posts", "글 관리", active === "posts")}
            ${adminLink("#/admin/editor", "새 글 작성", active === "editor")}
            ${adminLink("#/admin/comments", "댓글", active === "comments")}
            <a href="#/" data-action="logout">로그아웃</a>
          </nav>
        </aside>
        <section class="admin-main">
          <header class="admin-topbar">
            <div class="admin-topbar-inner">
              <div>
                <h1>${escapeHtml(title)}</h1>
                <p class="muted">${escapeHtml(subtitle)}</p>
              </div>
              ${cta}
            </div>
          </header>
          <main class="admin-content">${content}</main>
        </section>
      </div>
    `;
  }

  function adminLink(href, label, active) {
    return `<a class="${active ? "active" : ""}" href="${href}">${label}</a>`;
  }

  function renderHome() {
    const posts = getPublishedPosts();
    const categories = getCategories();
    const filtered = posts.filter((post) => {
      const matchesCategory =
        ui.category === "전체" || post.category === ui.category;
      const q = ui.query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        [post.title, post.excerpt, post.category, post.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesCategory && matchesQuery;
    });
    const [featured, ...rest] = filtered;

    return layoutPublic(`
      <section class="page">
        <section class="home-intro">
          <div>
            <p class="eyebrow">개인 블로그</p>
            <h1 class="page-title">최근에 쓴 글을 빠르게 읽고 탐색합니다</h1>
            <p class="page-copy">개발 기록, 배운 점, 프로젝트 회고를 검색과 태그 중심으로 정리한 JH_BLOG입니다.</p>
          </div>
          <div class="home-object" aria-hidden="true">
            ${renderIcon("blog", "home-object-main", "")}
            ${renderIcon("search", "home-object-chip search", "")}
            ${renderIcon("stats", "home-object-chip stats", "")}
          </div>
        </section>

        <div class="sticky-filter">
          <div class="toolbar">
            <span class="filter-icon" aria-hidden="true">${renderIcon("search", "filter-icon-img", "")}</span>
            <input class="input search-input" data-action="search" placeholder="글 제목, 태그, 본문 검색" value="${escapeHtml(ui.query)}" />
            ${categories
              .map(
                (category) =>
                  `<button class="chip ${ui.category === category ? "active" : ""}" data-action="category" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`,
              )
              .join("")}
          </div>
        </div>

        <div class="home-grid">
          <section class="post-list" aria-label="글 목록">
            ${
              featured
                ? renderPostCard(featured, true) +
                  rest.map((post) => renderPostCard(post, false)).join("")
                : `<div class="empty">조건에 맞는 글이 없습니다.</div>`
            }
          </section>
          <aside class="sidebar-stack">
            ${renderSelectedPanel(featured || posts[0])}
            <section class="card side-panel">
              <h3>태그</h3>
              <div class="tag-row">
                ${getAllTags()
                  .map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`)
                  .join("")}
              </div>
            </section>
          </aside>
        </div>
      </section>
    `);
  }

  function renderPostCard(post, featured) {
    const minutes = readingMinutes(post);
    return `
      <article class="card post-card ${featured ? "" : "compact"}">
        <a href="#/post/${post.id}" aria-label="${escapeHtml(post.title)}">
          ${renderVisualCover(post, featured ? "feature" : "compact")}
        </a>
        <div>
          <div class="post-meta">${formatDate(post.createdAt)} · ${escapeHtml(post.category)} · ${minutes}분 읽기 · 조회 ${post.views}</div>
          <h2 class="post-title"><a href="#/post/${post.id}">${escapeHtml(post.title)}</a></h2>
          <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
          <div class="tag-row">
            ${post.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      </article>
    `;
  }

  function renderSelectedPanel(post) {
    if (!post) return "";
    return `
      <section class="card side-panel">
        <h2>선택한 글</h2>
        <p class="muted">지금 먼저 읽기 좋은 글입니다.</p>
        ${renderVisualCover(post, "panel")}
        <h3>${escapeHtml(post.title)}</h3>
        <p class="muted">${escapeHtml(post.excerpt)}</p>
        <a class="button primary" href="#/post/${post.id}">읽기</a>
      </section>
    `;
  }

  function renderPost(id, shouldIncrement = false) {
    const post = getPost(id);
    if (!post || (post.status !== "published" && !isAuthed())) {
      return layoutPublic(`<section class="page"><div class="empty">글을 찾을 수 없습니다.</div></section>`);
    }

    if (shouldIncrement) {
      post.views += 1;
      saveState();
    }

    const toc = getToc(post.content);
    const comments = postComments(post.id);
    const minutes = readingMinutes(post);
    return layoutPublic(`
      <section class="page article-layout">
        <article class="card article">
          <header class="article-hero">
            ${renderVisualCover(post, "article")}
            <div class="article-hero-copy">
              <p class="eyebrow">${escapeHtml(post.category)}</p>
              <h1>${escapeHtml(post.title)}</h1>
              <div class="article-meta-grid" aria-label="글 정보">
                <span>${formatDate(post.createdAt)}</span>
                <span>${minutes}분 읽기</span>
                <span>조회 ${post.views}</span>
                <span>댓글 ${comments.length}</span>
              </div>
            </div>
          </header>
          <div class="tag-row" style="margin: 18px 0 28px;">
            ${post.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="article-body">${renderMarkdown(contentWithoutDuplicateTitle(post.content, post.title))}</div>
          <section class="card comments">
            <div class="section-heading">
              ${renderIcon("comment", "section-heading-icon", "")}
              <h2>댓글</h2>
            </div>
            <form class="form-grid" data-form="comment" data-post-id="${post.id}">
              <div class="two-col">
                <label>이름<input class="input" name="author" required placeholder="이름" /></label>
                <label>비밀번호<input class="input" name="password" type="password" required placeholder="댓글 비밀번호" autocomplete="new-password" /></label>
              </div>
              <p class="muted">댓글은 등록 즉시 공개됩니다. 비밀번호는 추후 댓글 관리용으로만 저장됩니다.</p>
              <label>댓글<textarea class="textarea" name="body" required placeholder="댓글을 입력하세요"></textarea></label>
              <button class="button primary" type="submit">댓글 등록</button>
            </form>
            <div class="comment-list">
              ${
                comments.length
                  ? comments.map(renderComment).join("")
                  : `<div class="empty">아직 공개된 댓글이 없습니다.</div>`
              }
            </div>
          </section>
        </article>
        <aside class="card toc" aria-label="글 목차">
          <strong>목차</strong>
          ${
            toc.length
              ? toc
                  .map(
                    (item, index) =>
                      `<a class="${index === 0 ? "active" : ""}" href="#${item.id}" data-toc-link>${escapeHtml(item.label)}</a>`,
                  )
                  .join("")
              : `<p class="muted">목차 없음</p>`
          }
        </aside>
      </section>
    `);
  }

  function renderComment(comment) {
    return `
      <article class="comment">
        <strong>${escapeHtml(comment.author)}</strong>
        <p>${escapeHtml(comment.body)}</p>
        <span class="muted">${formatDate(comment.createdAt)}</span>
      </article>
    `;
  }

  function renderLogin(error = "") {
    return `
      <div class="login-page app">
        <section class="card login-card">
          <div class="brand">${iconLabel("JH")}<span>JH_BLOG</span></div>
          <h1>관리자 로그인</h1>
          <p class="muted">나만 사용하는 블로그 관리자 콘솔입니다.</p>
          <form class="form-grid" data-form="login">
            ${error ? `<div class="alert">${escapeHtml(error)}</div>` : ""}
            <label>아이디<input class="input" name="id" autocomplete="username" required /></label>
            <label>비밀번호<input class="input" name="password" type="password" autocomplete="current-password" required /></label>
            <button class="button primary" type="submit">로그인</button>
          </form>
        </section>
      </div>
    `;
  }

  function renderDashboard() {
    const posts = state.posts;
    const published = posts.filter((post) => post.status === "published");
    const pending = state.comments.filter((comment) => comment.status === "pending");
    const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
    const popular = [...published].sort((a, b) => b.views - a.views).slice(0, 5);
    const recentComments = [...state.comments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    return adminLayout(
      "대시보드",
      "오늘 블로그 상태와 처리할 일을 한 화면에서 확인합니다.",
      "dashboard",
      `
        <section class="stat-grid">
          ${statCard("전체 조회수", totalViews.toLocaleString(), "누적 기준")}
          ${statCard("발행 글", published.length, `초안 ${posts.length - published.length}개`)}
          ${statCard("댓글", state.comments.length, `승인 대기 ${pending.length}개`)}
          ${statCard("평균 조회", published.length ? Math.round(totalViews / published.length) : 0, "발행 글 기준")}
        </section>
        <section class="dashboard-grid">
          <div class="card panel">
            <h2>조회수 추이</h2>
            <div class="chart">
              ${[320, 520, 410, 680, 760, 590, Math.max(120, totalViews % 900)]
                .map((value, index, arr) => {
                  const max = Math.max(...arr);
                  const height = Math.max(24, Math.round((value / max) * 180));
                  return `<div class="bar ${index === arr.length - 1 ? "active" : ""}" style="height:${height}px"><span>${value.toLocaleString()}회</span></div>`;
                })
                .join("")}
            </div>
          </div>
          <div class="card panel">
            <h2>인기 글</h2>
            <div class="post-list">
              ${popular
                .map(
                  (post, index) => `
                    <a class="post-card compact" href="#/post/${post.id}">
                      <div class="thumb ${index === 0 ? "orange" : ""}"></div>
                      <div>
                        <h3 class="post-title">${escapeHtml(post.title)}</h3>
                        <p class="muted">조회 ${post.views}</p>
                      </div>
                    </a>
                  `,
                )
                .join("")}
            </div>
          </div>
          <div class="card panel">
            <h2>최근 댓글</h2>
            <div class="comment-list">
              ${recentComments
                .map(
                  (comment) => `
                    <div class="comment">
                      <span class="status ${comment.status}">${comment.status === "pending" ? "승인 대기" : "게시됨"}</span>
                      <strong style="display:block; margin-top:8px;">${escapeHtml(comment.author)}</strong>
                      <p>${escapeHtml(comment.body)}</p>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
          <div class="card panel">
            <h2>빠른 작업</h2>
            <div class="row-actions">
              <a class="button primary" href="#/admin/editor">새 글 작성</a>
              <a class="button" href="#/admin/posts">초안 보기</a>
              <a class="button" href="#/admin/comments">댓글 검토</a>
            </div>
          </div>
        </section>
      `,
      `<a class="button primary" href="#/admin/editor">새 글 작성</a>`,
    );
  }

  function statCard(label, value, caption) {
    return `
      <article class="card stat-card">
        <span class="muted">${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <p class="muted">${escapeHtml(caption)}</p>
      </article>
    `;
  }

  function renderPostsAdmin() {
    const rows = [...state.posts].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );
    return adminLayout(
      "글 관리",
      "발행 글과 초안을 수정하고 정리합니다.",
      "posts",
      `
        <div class="card panel">
          <table class="table">
            <thead>
              <tr><th>제목</th><th>상태</th><th>카테고리</th><th>조회</th><th>수정일</th><th></th></tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (post) => `
                    <tr>
                      <td><strong>${escapeHtml(post.title)}</strong><br /><span class="muted">${escapeHtml(post.excerpt)}</span></td>
                      <td><span class="status ${post.status}">${post.status === "published" ? "발행" : "초안"}</span></td>
                      <td>${escapeHtml(post.category)}</td>
                      <td>${post.views}</td>
                      <td>${formatDate(post.updatedAt)}</td>
                      <td>
                        <div class="row-actions">
                          <a class="button" href="#/admin/editor/${post.id}">수정</a>
                          <button class="button danger" data-action="delete-post" data-id="${post.id}">삭제</button>
                        </div>
                      </td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `,
      `<a class="button primary" href="#/admin/editor">새 글 작성</a>`,
    );
  }

  function renderEditor(id = "") {
    const post = id ? getPost(id) : null;
    const isEdit = Boolean(post);
    const draft = post || {
      id: "",
      title: "",
      excerpt: "",
      category: "개발",
      tags: [],
      status: "draft",
      cover: "neutral",
      content: "# 새 글 제목\n\n여기에 글을 작성하세요.",
    };

    return adminLayout(
      isEdit ? "글 수정" : "새 글 작성",
      "마크다운 작성과 미리보기를 함께 확인합니다.",
      "editor",
      `
        <form class="form-grid" data-form="post-editor" data-id="${escapeHtml(draft.id)}">
          <div class="card panel form-grid">
            <label>제목<input class="input" name="title" required value="${escapeHtml(draft.title)}" placeholder="글 제목을 입력하세요" /></label>
            <div class="two-col">
              <label>카테고리<input class="input" name="category" required value="${escapeHtml(draft.category)}" /></label>
              <label>태그<input class="input" name="tags" value="${escapeHtml(draft.tags.join(", "))}" placeholder="Next.js, UX" /></label>
            </div>
            <label>요약<textarea class="textarea" name="excerpt" required>${escapeHtml(draft.excerpt)}</textarea></label>
            <div class="two-col">
              <label>상태
                <select class="select" name="status">
                  <option value="draft" ${draft.status === "draft" ? "selected" : ""}>초안</option>
                  <option value="published" ${draft.status === "published" ? "selected" : ""}>발행</option>
                </select>
              </label>
              <label>커버 톤
                <select class="select" name="cover">
                  <option value="neutral" ${draft.cover === "neutral" ? "selected" : ""}>Neutral</option>
                  <option value="blog" ${draft.cover === "blog" ? "selected" : ""}>Blog object</option>
                  <option value="dev" ${draft.cover === "dev" ? "selected" : ""}>Development</option>
                  <option value="admin" ${draft.cover === "admin" ? "selected" : ""}>Admin UX</option>
                  <option value="markdown" ${draft.cover === "markdown" ? "selected" : ""}>Markdown</option>
                  <option value="comment" ${draft.cover === "comment" ? "selected" : ""}>Comment</option>
                  <option value="til" ${draft.cover === "til" ? "selected" : ""}>TIL</option>
                  <option value="retro" ${draft.cover === "retro" ? "selected" : ""}>Retrospective</option>
                  <option value="stats" ${draft.cover === "stats" ? "selected" : ""}>Stats</option>
                  <option value="search" ${draft.cover === "search" ? "selected" : ""}>Search</option>
                </select>
              </label>
            </div>
          </div>

          <div class="mobile-editor-tabs">
            <button class="button ${ui.editorMode === "write" ? "primary" : ""}" type="button" data-action="editor-tab" data-mode="write">작성</button>
            <button class="button ${ui.editorMode === "preview" ? "primary" : ""}" type="button" data-action="editor-tab" data-mode="preview">미리보기</button>
          </div>

          <section class="editor-layout ${ui.editorMode === "preview" ? "show-preview" : ""}">
            <div class="card editor-pane" data-pane="write">
              <div class="editor-toolbar">
                ${["B", "I", "H2", "Link", "Code", "Quote"].map((tool) => `<button class="button" type="button" data-action="insert-markdown" data-tool="${tool}">${tool}</button>`).join("")}
              </div>
              <textarea class="textarea markdown-input" name="content" data-editor-content>${escapeHtml(draft.content)}</textarea>
            </div>
            <div class="card editor-pane" data-pane="preview">
              <div class="editor-toolbar"><strong>Preview</strong><span class="muted">실제 상세 화면 기준</span></div>
              <article class="article-body preview" data-editor-preview>${renderMarkdown(draft.content)}</article>
            </div>
          </section>
          <div class="row-actions" style="position: sticky; bottom: 16px; z-index: 20; justify-content: flex-end;">
            <button class="button" type="button" data-action="save-draft">임시저장</button>
            <button class="button primary" type="submit">${isEdit ? "수정 저장" : "글 저장"}</button>
          </div>
        </form>
      `,
    );
  }

  function renderCommentsAdmin() {
    const comments = [...state.comments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    return adminLayout(
      "댓글 관리",
      "승인 대기 댓글을 확인하고 공개 여부를 정합니다.",
      "comments",
      `
        <div class="card panel">
          <table class="table">
            <thead>
              <tr><th>댓글</th><th>글</th><th>상태</th><th>작성일</th><th></th></tr>
            </thead>
            <tbody>
              ${comments
                .map((comment) => {
                  const post = getPost(comment.postId);
                  return `
                    <tr>
                      <td><strong>${escapeHtml(comment.author)}</strong><br />${escapeHtml(comment.body)}</td>
                      <td>${post ? escapeHtml(post.title) : "삭제된 글"}</td>
                      <td><span class="status ${comment.status}">${comment.status === "pending" ? "승인 대기" : "게시됨"}</span></td>
                      <td>${formatDate(comment.createdAt)}</td>
                      <td>
                        <div class="row-actions">
                          ${
                            comment.status === "pending"
                              ? `<button class="button primary" data-action="approve-comment" data-id="${comment.id}">승인</button>`
                              : ""
                          }
                          <button class="button danger" data-action="delete-comment" data-id="${comment.id}">삭제</button>
                        </div>
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `,
    );
  }

  function router() {
    const hash = window.location.hash || "#/";
    const [path] = hash.slice(1).split("?");
    const parts = path.split("/").filter(Boolean);

    if (parts[0] === "admin" && parts[1] !== "login" && !isAuthed()) {
      navigate("#/admin/login");
      return;
    }

    const routeKey = hash;
    if (parts[0] === "post") {
      const shouldIncrement = routeKey !== lastRouteKey;
      lastRouteKey = routeKey;
      app.innerHTML = renderPost(parts[1], shouldIncrement);
    } else if (parts[0] === "admin" && parts[1] === "login") {
      app.innerHTML = renderLogin();
    } else if (parts[0] === "admin" && !parts[1]) {
      app.innerHTML = renderDashboard();
    } else if (parts[0] === "admin" && parts[1] === "posts") {
      app.innerHTML = renderPostsAdmin();
    } else if (parts[0] === "admin" && parts[1] === "editor") {
      app.innerHTML = renderEditor(parts[2] || "");
    } else if (parts[0] === "admin" && parts[1] === "comments") {
      app.innerHTML = renderCommentsAdmin();
    } else {
      lastRouteKey = routeKey;
      app.innerHTML = renderHome();
    }

    requestAnimationFrame(() => {
      updateHeaderCompact();
      updateReadProgress();
      updateToc();
      bindEditorPreview();
    });
  }

  function bindEditorPreview() {
    const content = document.querySelector("[data-editor-content]");
    const preview = document.querySelector("[data-editor-preview]");
    if (!content || !preview) return;
    content.addEventListener("input", () => {
      preview.innerHTML = renderMarkdown(content.value);
    });
  }

  function updateHeaderCompact() {
    const header = document.querySelector("[data-public-header]");
    if (!header) return;
    header.classList.toggle("is-compact", window.scrollY > 24);
  }

  function updateReadProgress() {
    const article = document.querySelector(".article");
    const bar = document.querySelector("[data-progress-bar]");
    if (!article || !bar) {
      if (bar) bar.style.width = "0%";
      return;
    }
    const rect = article.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight + 120);
    const progress = Math.min(100, Math.max(0, ((-rect.top + 90) / total) * 100));
    bar.style.width = `${progress}%`;
  }

  function updateToc() {
    const headings = [...document.querySelectorAll(".article-body h2, .article-body h3")];
    const links = [...document.querySelectorAll("[data-toc-link]")];
    if (!headings.length || !links.length) return;
    let active = headings[0].id;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top < 150) active = heading.id;
    }
    links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${active}`));
  }

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-action='search']")) {
      ui.query = event.target.value;
      app.innerHTML = renderHome();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;

    if (action === "category") {
      ui.category = target.dataset.category;
      app.innerHTML = renderHome();
    }

    if (action === "logout") {
      event.preventDefault();
      setAuthed(false);
      navigate("#/");
    }

    if (action === "delete-post") {
      const id = target.dataset.id;
      if (confirm("이 글을 삭제할까요?")) {
        state.posts = state.posts.filter((post) => post.id !== id);
        state.comments = state.comments.filter((comment) => comment.postId !== id);
        saveState();
        router();
      }
    }

    if (action === "approve-comment") {
      const comment = state.comments.find((item) => item.id === target.dataset.id);
      if (comment) {
        comment.status = "published";
        saveState();
        router();
      }
    }

    if (action === "delete-comment") {
      state.comments = state.comments.filter((item) => item.id !== target.dataset.id);
      saveState();
      router();
    }

    if (action === "editor-tab") {
      ui.editorMode = target.dataset.mode;
      const layout = document.querySelector(".editor-layout");
      if (layout) layout.classList.toggle("show-preview", ui.editorMode === "preview");
      document
        .querySelectorAll("[data-action='editor-tab']")
        .forEach((button) =>
          button.classList.toggle("primary", button.dataset.mode === ui.editorMode),
        );
    }

    if (action === "insert-markdown") {
      const textarea = document.querySelector("[data-editor-content]");
      if (!textarea) return;
      const tool = target.dataset.tool;
      insertMarkdown(textarea, tool);
    }

    if (action === "save-draft") {
      const form = target.closest("form");
      if (!form) return;
      form.querySelector("[name='status']").value = "draft";
      savePostFromForm(form);
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (form.dataset.form === "login") {
      event.preventDefault();
      const data = new FormData(form);
      const button = form.querySelector("button");
      button.disabled = true;
      button.textContent = "로그인 중";
      setTimeout(() => {
        if (data.get("id") === ADMIN.id && data.get("password") === ADMIN.password) {
          setAuthed(true);
          navigate("#/admin");
        } else {
          app.innerHTML = renderLogin("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
      }, 240);
    }

    if (form.dataset.form === "comment") {
      event.preventDefault();
      const data = new FormData(form);
      const author = data.get("author").trim();
      const password = data.get("password").trim();
      const body = data.get("body").trim();
      if (!author || !password || !body) return;
      state.comments.unshift({
        id: uid("comment"),
        postId: form.dataset.postId,
        author,
        body,
        status: "published",
        passwordHash: localPasswordHash(password),
        createdAt: new Date().toISOString(),
      });
      saveState();
      form.reset();
      const notice = document.createElement("div");
      notice.className = "alert success";
      notice.textContent = "댓글이 바로 등록되었습니다.";
      form.prepend(notice);
    }

    if (form.dataset.form === "post-editor") {
      event.preventDefault();
      savePostFromForm(form);
    }
  });

  function insertMarkdown(textarea, tool) {
    const snippets = {
      B: ["**", "**"],
      I: ["*", "*"],
      H2: ["\n## ", ""],
      Link: ["[링크 텍스트](", ")"],
      Code: ["\n```js\n", "\n```\n"],
      Quote: ["\n> ", ""],
    };
    const [before, after] = snippets[tool] || ["", ""];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    textarea.value =
      textarea.value.slice(0, start) +
      before +
      selected +
      after +
      textarea.value.slice(end);
    textarea.focus();
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selected.length;
    textarea.dispatchEvent(new Event("input"));
  }

  function savePostFromForm(form) {
    const data = new FormData(form);
    const id = form.dataset.id || uid("post");
    const existing = getPost(id);
    const tags = data
      .get("tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const now = new Date().toISOString();
    const next = {
      id,
      title: data.get("title").trim(),
      excerpt: data.get("excerpt").trim(),
      category: data.get("category").trim(),
      tags,
      status: data.get("status"),
      cover: data.get("cover"),
      content: data.get("content"),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      views: existing?.views || 0,
    };

    if (existing) {
      state.posts = state.posts.map((post) => (post.id === id ? next : post));
    } else {
      state.posts.unshift(next);
    }

    saveState();
    navigate("#/admin/posts");
  }

  window.addEventListener("hashchange", router);
  window.addEventListener("scroll", () => {
    updateHeaderCompact();
    updateReadProgress();
    updateToc();
  });

  router();
})();
