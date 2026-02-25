const USERNAME = "Axlirr";
const FEATURED = [
  "psa-portus-ai",
  "ai-data-storyteller",
  "financial-analytics-dashboard",
  "medical-image-analysis",
  "PORTUS-AI",
  "my-new-website",
];

const els = {
  totalRepos: document.getElementById("totalRepos"),
  topLang: document.getElementById("topLang"),
  followers: document.getElementById("followers"),
  primaryFocus: document.getElementById("primaryFocus"),
  featuredGrid: document.getElementById("featuredGrid"),
  allProjects: document.getElementById("allProjects"),
  searchInput: document.getElementById("searchInput"),
  languageFilter: document.getElementById("languageFilter"),
  projectTemplate: document.getElementById("projectTemplate"),
  year: document.getElementById("year"),
};

let allRepos = [];

const focusKeywords = [
  { k: /(ai|automation|agent|analytics|ml|deep learning|transformer)/i, v: "AI & Automation" },
  { k: /(dashboard|web|frontend|api|next|typescript|javascript)/i, v: "Web & Product Engineering" },
  { k: /(data|analysis|visuali|story)/i, v: "Data Products" },
];

function inferFocus(repos) {
  const text = repos
    .map((r) => `${r.name} ${r.description || ""}`)
    .join(" | ");
  for (const f of focusKeywords) {
    if (f.k.test(text)) return f.v;
  }
  return "Software Engineering";
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function createCard(repo) {
  const node = els.projectTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".lang").textContent = repo.language || "Multi-stack";
  node.querySelector(".updated").textContent = `Updated ${fmtDate(repo.updated_at)}`;
  node.querySelector(".name").textContent = repo.name;
  node.querySelector(".desc").textContent = repo.description || "No description provided yet.";
  const tags = node.querySelector(".tags");
  (repo.topics || []).slice(0, 4).forEach((t) => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.textContent = t;
    tags.appendChild(chip);
  });
  const link = node.querySelector(".repo-link");
  link.href = repo.html_url;
  return node;
}

function render() {
  const query = els.searchInput.value.trim().toLowerCase();
  const lang = els.languageFilter.value;

  const filtered = allRepos.filter((r) => {
    const hitQuery = !query || `${r.name} ${r.description || ""}`.toLowerCase().includes(query);
    const hitLang = lang === "all" || (r.language || "Unknown") === lang;
    return hitQuery && hitLang;
  });

  const featured = filtered.filter((r) => FEATURED.includes(r.name));
  const others = filtered.filter((r) => !FEATURED.includes(r.name));

  els.featuredGrid.innerHTML = "";
  (featured.length ? featured : filtered.slice(0, 6)).forEach((r) => els.featuredGrid.appendChild(createCard(r)));

  els.allProjects.innerHTML = "";
  (others.length ? others : filtered).forEach((r) => els.allProjects.appendChild(createCard(r)));
}

async function load() {
  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${USERNAME}`),
      fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`),
    ]);

    const profile = await profileRes.json();
    allRepos = await reposRes.json();

    if (!Array.isArray(allRepos)) throw new Error("GitHub API unavailable");

    allRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    els.totalRepos.textContent = profile.public_repos ?? allRepos.length;
    els.followers.textContent = profile.followers ?? "—";
    els.primaryFocus.textContent = inferFocus(allRepos);

    const langCount = allRepos.reduce((acc, r) => {
      const key = r.language || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const top = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0];
    els.topLang.textContent = top ? top[0] : "—";

    const langs = Object.keys(langCount).sort();
    langs.forEach((l) => {
      const o = document.createElement("option");
      o.value = l;
      o.textContent = l;
      els.languageFilter.appendChild(o);
    });

    render();
  } catch (e) {
    els.featuredGrid.innerHTML = `<article class="card" style="padding:16px">Could not load GitHub data right now.</article>`;
  }
}

els.searchInput.addEventListener("input", render);
els.languageFilter.addEventListener("change", render);
els.year.textContent = new Date().getFullYear();
load();