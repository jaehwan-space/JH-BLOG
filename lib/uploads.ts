import path from "node:path";

export const ALLOWED_IMAGE_TYPES = new Map([
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export function getUploadRoot() {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR);
  }

  return path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
}

export function getUploadExtension(mimeType: string) {
  return ALLOWED_IMAGE_TYPES.get(mimeType) || "";
}

export function isSafeUploadFilename(filename: string) {
  return /^[a-zA-Z0-9._-]+$/.test(filename) && !filename.includes("..");
}
