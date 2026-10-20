/** Public base path, always with a trailing slash so `${base}search` is `/helpmeprep/search`. */
export function siteBase(): string {
  const raw = import.meta.env.BASE_URL || "/";
  if (raw === "/") return "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}
