export const siteConfig = {
  name: "JH_BLOG",
  description: "개발 기록, 회고, 댓글, 이미지, 통계를 직접 관리하는 개인 기술 블로그입니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
};

export function absoluteUrl(pathname = "/") {
  return new URL(pathname, siteConfig.url).toString();
}
