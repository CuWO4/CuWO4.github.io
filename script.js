const grid = document.getElementById("repo-grid");
const empty = document.getElementById("empty-state");
const lastUpdated = document.getElementById("last-updated");

const ICON_STAR =
  '<svg class="octicon octicon-star" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>';
const ICON_COMMIT =
  '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path></svg>';

const LANG_COLORS = {
  "C": "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  "Java": "#b07219",
  "JavaScript": "#f1e05a",
  "TypeScript": "#3178c6",
  "Python": "#3572A5",
  "Go": "#00ADD8",
  "Rust": "#dea584",
  "Ruby": "#701516",
  "PHP": "#4F5D95",
  "Shell": "#89e051",
  "PowerShell": "#012456",
  "HTML": "#e34c26",
  "CSS": "#663399",
  "Coq": "#d0b68c",
  "Scala": "#c22d40",
  "Kotlin": "#A97BFF",
  "Swift": "#F05138",
  "Dart": "#00B4AB",
  "Vue": "#41b883",
  "TeX": "#3D6117",
  "Markdown": "#083fa1",
  "Jupyter Notebook": "#DA5B0B",
  "Assembly": "#6E4C13",
  "Objective-C": "#438eff",
  "Perl": "#0298c3",
  "Lua": "#000080",
  "Haskell": "#5e5086",
  "Elixir": "#6e4a7e",
  "Erlang": "#B83998",
  "Julia": "#a270ba",
  "R": "#198CE7",
  "MATLAB": "#e16737",
  "Fortran": "#4d41b1",
  "Zig": "#ec915c",
  "Nim": "#ffc200",
  "Makefile": "#427819",
  "Vim script": "#199f4b",
  "Dockerfile": "#384d54",
  "YAML": "#cb171e",
  "JSON": "#292929",
  "GLSL": "#5686a5",
};

function langColor(lang) {
  return LANG_COLORS[lang] || "#8b949e";
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function load() {
  let data;
  try {
    const res = await fetch("data/repos.json");
    if (!res.ok) throw new Error(String(res.status));
    data = await res.json();
  } catch {
    empty.hidden = false;
    return;
  }

  if (!data || !Array.isArray(data.repos) || data.repos.length === 0) {
    empty.hidden = false;
    return;
  }

  if (data.generated_at) {
    const el = document.createElement("span");
    el.title = new Date(data.generated_at).toUTCString();
    el.textContent = "Updated " + timeAgo(data.generated_at);
    lastUpdated.appendChild(el);
  }

  const frag = document.createDocumentFragment();
  for (const repo of data.repos) {
    frag.appendChild(renderCard(repo));
  }
  grid.appendChild(frag);
}

function renderCard(repo) {
  const card = document.createElement("a");
  card.className = "repo-card";
  card.href = repo.html_url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const name = document.createElement("div");
  name.className = "repo-name";
  name.textContent = repo.name;

  const desc = document.createElement("p");
  desc.className = "repo-desc";
  desc.textContent = repo.description || "";

  const meta = document.createElement("div");
  meta.className = "repo-meta";

  let metaHtml = "";
  if (repo.language) {
    metaHtml +=
      `<span class="lang"><span class="lang-dot" style="background:${langColor(repo.language)}"></span>${escapeHtml(repo.language)}</span>`;
  }
  metaHtml +=
    `<span class="meta-item">${ICON_STAR}${fmt(repo.stargazers_count)}</span>` +
    `<span class="meta-item">${ICON_COMMIT}${fmt(repo.commits)}</span>` +
    `<span class="meta-item" title="${new Date(repo.updated_at).toUTCString()}">Updated ${timeAgo(repo.updated_at)}</span>`;
  meta.innerHTML = metaHtml;

  card.appendChild(name);
  card.appendChild(desc);
  card.appendChild(meta);
  return card;
}

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

async function loadAuthor() {
  const link = document.getElementById("author-link");
  const avatar = document.getElementById("author-avatar");
  const nameEl = document.getElementById("author-name");
  const bioEl = document.getElementById("author-bio");
  const emailEl = document.getElementById("author-email");

  let user;
  try {
    const res = await fetch("https://api.github.com/users/CuWO4");
    if (!res.ok) return;
    user = await res.json();
  } catch {
    return;
  }

  link.href = user.html_url || "https://github.com/CuWO4";
  avatar.src = user.avatar_url || "";
  avatar.alt = user.login || "avatar";
  nameEl.textContent = user.name || user.login || "";
  if (user.bio) bioEl.textContent = user.bio;
  else bioEl.remove();
  if (user.email) emailEl.textContent = user.email;
  else emailEl.remove();
}

loadAuthor();
load();
