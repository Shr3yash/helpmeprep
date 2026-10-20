import tracksFile from "../content/tracks.json";

export type TrackConfig = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  status: "ready" | "stub";
  sections: string[];
};

export const trackConfigs = tracksFile.tracks as TrackConfig[];

export function trackById(id: string): TrackConfig | undefined {
  return trackConfigs.find((t) => t.id === id);
}

export function sectionRank(trackId: string, section: string): number {
  const track = trackById(trackId);
  if (!track) return 1000;
  const i = track.sections.indexOf(section);
  return i === -1 ? 500 : i;
}
