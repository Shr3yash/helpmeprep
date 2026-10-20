const THEME_KEY = "helpmeprep-theme";
const PROGRESS_KEY = "helpmeprep-progress";

type QuizScore = { correct: number; total: number; at: string };
type Progress = Record<string, { complete?: boolean; quiz?: QuizScore }>;

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveProgress(p: Progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  document.dispatchEvent(new CustomEvent("helpmeprep-progress"));
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (btn) btn.textContent = theme === "dark" ? "Light" : "Dark";
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
  const theme = stored || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    void renderMermaid();
  });
}

function paintChecks() {
  const progress = loadProgress();
  document.querySelectorAll<HTMLElement>("[data-slug]").forEach((el) => {
    const slug = el.dataset.slug;
    if (!slug) return;
    el.classList.toggle("is-complete", Boolean(progress[slug]?.complete));
  });
  const btn = document.querySelector<HTMLButtonElement>("[data-complete]");
  const slug = btn?.dataset.complete;
  if (btn && slug) {
    const on = Boolean(progress[slug]?.complete);
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "Completed" : "Mark complete";
  }
}

function initComplete() {
  document.querySelector("[data-complete]")?.addEventListener("click", (ev) => {
    const btn = ev.currentTarget as HTMLButtonElement;
    const slug = btn.dataset.complete;
    if (!slug) return;
    const progress = loadProgress();
    const next = !progress[slug]?.complete;
    progress[slug] = { ...progress[slug], complete: next };
    saveProgress(progress);
    paintChecks();
  });
}

function initNav() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".backdrop");
  const open = (on: boolean) => {
    sidebar?.classList.toggle("open", on);
    backdrop?.classList.toggle("show", on);
  };
  document.querySelector("[data-menu]")?.addEventListener("click", () => open(true));
  backdrop?.addEventListener("click", () => open(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") open(false);
    if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
      const search = document.querySelector<HTMLAnchorElement>("[data-search-link]");
      if (search) {
        e.preventDefault();
        location.href = search.href;
      }
    }
  });
}

function initQuiz() {
  const root = document.querySelector<HTMLElement>("[data-quiz-root]");
  if (!root) return;
  const slug = root.dataset.slug || "";
  const raw = root.querySelector("[data-quiz-json]")?.textContent || "[]";
  const items = JSON.parse(raw) as Array<{
    kind: "mc" | "short";
    question: string;
    choices?: string[];
    answer?: number;
    reveal?: string;
    explain?: string;
  }>;
  const totalMc = items.filter((i) => i.kind === "mc").length;
  let correct = 0;
  let answered = 0;

  const scoreEl = root.querySelector<HTMLElement>("[data-score]");
  const updateScore = () => {
    if (!scoreEl) return;
    scoreEl.textContent =
      totalMc === 0
        ? "Short answers are for practice. Nothing is graded."
        : `${correct} / ${totalMc} multiple choice correct.`;
    if (answered === totalMc && totalMc > 0) {
      const progress = loadProgress();
      progress[slug] = {
        ...progress[slug],
        quiz: { correct, total: totalMc, at: new Date().toISOString() },
      };
      saveProgress(progress);
    }
  };

  root.querySelectorAll<HTMLElement>("[data-q]").forEach((block) => {
    const index = Number(block.dataset.q);
    const item = items[index];
    if (!item) return;
    if (item.kind === "mc") {
      block.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (block.dataset.locked) return;
          block.dataset.locked = "1";
          const choice = Number(btn.dataset.choice);
          const ok = choice === item.answer;
          btn.classList.add(ok ? "correct" : "wrong");
          if (!ok && item.answer != null) {
            block.querySelector<HTMLButtonElement>(`[data-choice="${item.answer}"]`)?.classList.add("correct");
          }
          block.querySelectorAll("button").forEach((b) => (b.disabled = true));
          const exp = block.querySelector<HTMLElement>("[data-explain]");
          if (exp) {
            exp.hidden = false;
            exp.textContent = item.explain || (ok ? "Correct." : "See the highlighted choice.");
          }
          answered += 1;
          if (ok) correct += 1;
          updateScore();
        });
      });
    } else {
      block.querySelector("[data-reveal]")?.addEventListener("click", (ev) => {
        const exp = block.querySelector<HTMLElement>("[data-explain]");
        if (exp) {
          exp.hidden = false;
          exp.textContent = item.reveal || item.explain || "";
        }
        (ev.currentTarget as HTMLButtonElement).disabled = true;
      });
    }
  });
  updateScore();
}

function mermaidSource(code: HTMLElement): string {
  const lines = [...code.querySelectorAll<HTMLElement>(":scope > .line")];
  if (lines.length > 0) return lines.map((line) => line.textContent ?? "").join("\n");
  return code.textContent ?? "";
}

async function renderMermaid() {
  const pending = [
    ...document.querySelectorAll<HTMLElement>(
      "pre[data-language='mermaid'] > code, pre code.language-mermaid",
    ),
  ];
  const existing = [...document.querySelectorAll<HTMLElement>("[data-mermaid-source]")];
  if (pending.length === 0 && existing.length === 0) return;
  const mermaid = (await import("mermaid")).default;
  const dark = document.documentElement.dataset.theme === "dark";
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: dark ? "dark" : "neutral",
    fontFamily: "Source Sans 3, sans-serif",
  });

  const draw = async (host: HTMLElement, graph: string) => {
    const id = `mmd-${Math.random().toString(36).slice(2)}`;
    try {
      const { svg } = await mermaid.render(id, graph);
      host.innerHTML = svg;
      host.classList.remove("mermaid-error");
    } catch (err) {
      host.classList.add("mermaid-error");
      host.textContent = `Diagram failed to render: ${(err as Error).message}`;
    }
  };

  for (const code of pending) {
    const pre = code.parentElement;
    if (!pre) continue;
    const graph = mermaidSource(code).trim();
    const host = document.createElement("div");
    host.className = "mermaid-host";
    host.dataset.mermaidSource = graph;
    pre.replaceWith(host);
    await draw(host, graph);
  }
  for (const host of existing) {
    const graph = host.dataset.mermaidSource;
    if (!graph) continue;
    await draw(host, graph);
  }
}

function initProgressPage() {
  const root = document.querySelector<HTMLElement>("[data-progress-page]");
  if (!root) return;
  const render = () => {
    const pages = JSON.parse(root.querySelector("[data-progress-json]")?.textContent || "[]") as Array<{
      slug: string;
      title: string;
      track: string;
      section: string;
    }>;
    const progress = loadProgress();
    const byTrack = new Map<string, typeof pages>();
    for (const page of pages) {
      const list = byTrack.get(page.track) ?? [];
      list.push(page);
      byTrack.set(page.track, list);
    }
    const tracks = [...byTrack.entries()];
    root.querySelector("[data-progress-body]")!.innerHTML = tracks
      .map(([track, list]) => {
        const done = list.filter((p) => progress[p.slug]?.complete).length;
        const pct = Math.round((done / list.length) * 100);
        const rows = list
          .map((p) => {
            const q = progress[p.slug]?.quiz;
            const mark = progress[p.slug]?.complete ? "Done" : "Not yet";
            const quiz = q ? `${q.correct}/${q.total}` : "—";
            return `<tr><td><a href="${root.dataset.base}${p.slug}">${p.title}</a></td><td>${p.section}</td><td>${mark}</td><td>${quiz}</td></tr>`;
          })
          .join("");
        return `<section><h2>${track}</h2><p>${done} of ${list.length} marked complete</p><div class="bar" aria-hidden="true"><span style="width:${pct}%"></span></div><table><thead><tr><th>Page</th><th>Section</th><th>Status</th><th>Quiz</th></tr></thead><tbody>${rows}</tbody></table></section>`;
      })
      .join("");
  };
  render();
  document.addEventListener("helpmeprep-progress", render);
}

initTheme();
initNav();
paintChecks();
initComplete();
initQuiz();
initProgressPage();
void renderMermaid();
