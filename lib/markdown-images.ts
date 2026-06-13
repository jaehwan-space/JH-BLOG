export type MarkdownImage = {
  alt: string;
  url: string;
};

const markdownImagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export function extractMarkdownImages(markdown: string): MarkdownImage[] {
  const images: MarkdownImage[] = [];

  for (const match of markdown.matchAll(markdownImagePattern)) {
    const alt = match[1]?.trim() || "";
    const url = match[2]?.trim() || "";

    if (url && !images.some((image) => image.url === url)) {
      images.push({ alt, url });
    }
  }

  return images;
}

export function getValidHeroImage(markdown: string, selectedUrl?: string) {
  const heroImageUrl = selectedUrl?.trim();
  if (!heroImageUrl) return { heroImageUrl: null, heroImageAlt: null };

  const image = extractMarkdownImages(markdown).find((item) => item.url === heroImageUrl);
  return {
    heroImageUrl: image?.url || null,
    heroImageAlt: image?.alt || null
  };
}
