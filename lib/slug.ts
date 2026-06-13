export function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function fallbackSlug(value: string, fallback = "post") {
  return createSlug(value) || fallback;
}
