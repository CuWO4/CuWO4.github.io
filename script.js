const grid = document.getElementById("repo-grid");
const empty = document.getElementById("empty-state");
const lastUpdated = document.getElementById("last-updated");

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

  if (repo.language) {
    const lang = document.createElement("span");
    lang.className = "lang";
    const dot = document.createElement("span");
    dot.className = "lang-dot";
    lang.appendChild(dot);
    lang.appendChild(document.createTextNode(repo.language));
    meta.appendChild(lang);
  }

  meta.appendChild(stat(fmt(repo.stargazers_count) + " stars"));
  meta.appendChild(stat(fmt(repo.commits) + " commits"));

  const updated = document.createElement("span");
  updated.title = new Date(repo.updated_at).toUTCString();
  updated.textContent = "Updated " + timeAgo(repo.updated_at);
  meta.appendChild(updated);

  card.appendChild(name);
  card.appendChild(desc);
  card.appendChild(meta);
  return card;
}

function stat(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
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

load();
