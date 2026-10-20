import { getCollection, type CollectionEntry } from "astro:content";
import { resolveQuiz } from "./quiz";
import { sectionRank, trackById, trackConfigs } from "./tracks";

export type PageEntry = CollectionEntry<"pages">;

export function pageSlug(entry: { id: string; data: { slug?: string } }): string {
  return entry.data.slug || entry.id;
}

/** Company collection ids follow the frontmatter slug (`companies/mercor`). Routes are one segment. */
export function companyRouteId(entry: { id: string }): string {
  return entry.id.split("/").filter(Boolean).pop() || entry.id;
}

export async function allPages(): Promise<PageEntry[]> {
  const pages = await getCollection("pages");
  return pages.sort((a, b) => {
    if (a.data.track !== b.data.track) return a.data.track.localeCompare(b.data.track);
    const sr = sectionRank(a.data.track, a.data.section) - sectionRank(b.data.track, b.data.section);
    if (sr !== 0) return sr;
    return a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);
  });
}

export async function pagesByTrack(trackId: string): Promise<PageEntry[]> {
  return (await allPages()).filter((p) => p.data.track === trackId);
}

export type NavSection = { section: string; pages: PageEntry[] };

export async function navForTrack(trackId: string): Promise<NavSection[]> {
  const pages = await pagesByTrack(trackId);
  const map = new Map<string, PageEntry[]>();
  for (const page of pages) {
    const list = map.get(page.data.section) ?? [];
    list.push(page);
    map.set(page.data.section, list);
  }
  const known = trackById(trackId)?.sections ?? [];
  const names = [...known.filter((s) => map.has(s)), ...[...map.keys()].filter((s) => !known.includes(s))];
  return names.map((section) => ({ section, pages: map.get(section) ?? [] }));
}

export function readingMinutes(body: string | undefined): number {
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function neighborPages(pages: PageEntry[], currentId: string): {
  prev?: PageEntry;
  next?: PageEntry;
} {
  const i = pages.findIndex((p) => p.id === currentId);
  return {
    prev: i > 0 ? pages[i - 1] : undefined,
    next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : undefined,
  };
}

export function quizFor(entry: { id: string; data: { slug?: string; quiz: QuizItemLike[] } }) {
  return resolveQuiz(pageSlug(entry), entry.data.quiz as QuizItemLike[]);
}

type QuizItemLike = PageEntry["data"]["quiz"][number];

export function indexPayload(pages: PageEntry[]) {
  return pages.map((p) => ({
    slug: pageSlug(p),
    title: p.data.title,
    track: p.data.track,
    section: p.data.section,
    description: p.data.description,
  }));
}

export function homeTracks() {
  return trackConfigs;
}
