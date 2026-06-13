import { test, expect, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const adminUsername = process.env.E2E_ADMIN_USERNAME || "jh_e2e_admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "e2e-password-1234";

async function login(page: import("@playwright/test").Page, password = adminPassword) {
  await page.goto("/admin/login");
  await page.getByLabel("아이디").fill(adminUsername);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
}

async function replaceTextareaValue(page: Page, editor: Locator, value: string) {
  await editor.click();
  await editor.selectText();
  await page.keyboard.insertText(value);
  await expect(editor).toHaveValue(value);
}

async function selectFeaturedPostOption(page: Page, title: string) {
  const select = page.getByTestId("featured-post-select");
  const option = select.locator("option").filter({ hasText: title });
  const value = await option.getAttribute("value");
  expect(value).toBeTruthy();
  await select.selectOption(value || "");
}

test("공개 홈, 글 상세, 댓글 흐름이 동작한다", async ({ page }) => {
  await page.goto("/");
  const publicHeader = page.locator("header").first();
  await expect(publicHeader.getByRole("link", { name: "글 목록" })).toBeVisible();
  await expect(publicHeader.getByRole("link", { name: "소개" })).toHaveCount(0);
  await expect(publicHeader.getByRole("link", { name: "관리자", exact: true })).toBeVisible();
  await expect(publicHeader.getByRole("button", { name: "검색 열기" })).toBeVisible();
  const carousel = page.getByTestId("featured-carousel");
  await expect(carousel.getByText("Featured Article")).toHaveCount(0);
  await expect(carousel.getByRole("link", { name: "대표 글 읽기" })).toHaveCount(0);
  await expect(carousel.getByRole("link", { name: "전체 글 보기" })).toHaveCount(0);
  await expect(carousel).toHaveAttribute("data-active-index", "0");
  const carouselButtonMetrics = await carousel.evaluate((element) => {
    const carouselRect = element.getBoundingClientRect();
    const previousButton = element.querySelector('[data-testid="featured-prev"]');
    if (!previousButton) return null;
    const buttonRect = previousButton.getBoundingClientRect();
    return {
      background: window.getComputedStyle(previousButton).backgroundColor,
      centerX: buttonRect.left + buttonRect.width / 2 - carouselRect.left,
      carouselWidth: carouselRect.width
    };
  });
  expect(carouselButtonMetrics).not.toBeNull();
  expect(carouselButtonMetrics?.centerX).toBeLessThan((carouselButtonMetrics?.carouselWidth || 0) * 0.45);
  expect(carouselButtonMetrics?.background).not.toBe("rgba(0, 0, 0, 0)");
  await expect.poll(async () => await carousel.getAttribute("data-active-index"), { timeout: 7_000 }).toBe("1");
  await page.getByTestId("featured-prev").click();
  await expect(page.getByTestId("featured-prev")).toBeVisible();
  await expect(page.getByTestId("featured-next")).toBeVisible();
  await expect(carousel).toHaveAttribute("data-active-index", "0");
  await page.getByTestId("featured-next").click();
  await expect(page.getByTestId("featured-prev")).toBeVisible();
  await expect(page.getByTestId("featured-next")).toBeVisible();
  await expect(carousel).toHaveAttribute("data-active-index", "1");
  await expect(page.getByRole("heading", { name: "전체 아티클" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "인기 있는 글" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "최신 댓글" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "아티클 시리즈" })).toBeVisible();
  await expect(page.getByText("관심 주제")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "JH_BLOG 소개" })).toHaveCount(0);
  await expect(page.locator("section.sticky.top-16")).toHaveCount(0);

  const articleItems = page.locator('[data-testid^="article-list-item-"]');
  await expect(articleItems).toHaveCount(5);
  await expect(page.locator('[data-testid^="article-page-"]')).toHaveCount(7);
  await expect(page.getByTestId("article-page-2")).toBeVisible();
  await expect(page.getByTestId("article-page-7")).toBeVisible();
  await expect(page.getByTestId("article-page-8")).toHaveCount(0);
  await page.getByTestId("article-page-2").click();
  await expect(page).toHaveURL(/[?&]page=2/);
  await page.goto("/?page=7#articles");
  await expect(page.getByTestId("article-page-7")).toBeVisible();
  await expect(page.getByTestId("article-page-4")).toBeVisible();
  await expect(page.getByTestId("article-page-3")).toHaveCount(0);
  await page.goto("/");

  await publicHeader.getByRole("button", { name: "검색 열기" }).click();
  const searchDialog = page.getByRole("dialog", { name: "글 검색" });
  await expect(searchDialog).toBeVisible();
  const searchInput = searchDialog.getByRole("textbox", { name: "검색어" });
  await expect(searchDialog.getByText("최근 글")).toBeVisible();
  await expect(searchDialog.getByTestId("search-category-e2e")).toBeVisible();
  await searchDialog.getByTestId("search-category-e2e").click();
  await expect(searchDialog.getByTestId("search-category-e2e")).toHaveAttribute("aria-pressed", "true");
  await expect(searchDialog.getByTestId("search-tag-e2e")).toBeVisible();
  await searchDialog.getByTestId("search-tag-e2e").click();
  await expect(searchDialog.getByTestId("search-tag-e2e")).toHaveAttribute("aria-pressed", "true");
  await searchInput.fill("사진 없는");
  await expect(searchDialog.getByRole("link", { name: /E2E 사진 없는 글/ })).toBeVisible();
  await searchInput.fill("없는검색어입니다");
  await expect(searchDialog.getByText("검색 결과가 없습니다.")).toBeVisible();
  await searchDialog.getByRole("button", { name: "닫기" }).click();
  await expect(searchDialog).toBeHidden();

  await page.getByRole("button", { name: "다크 모드로 전환" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "라이트 모드로 전환" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.goto("/posts/e2e-published-post");
  const detailHeader = page.locator("article header").first();
  await expect(detailHeader.locator("h1", { hasText: "E2E 공개 글" })).toBeVisible();
  await expect(detailHeader.getByRole("button", { name: "이전 화면으로 돌아가기" })).toBeVisible();
  await expect(detailHeader.getByRole("link", { name: "글 목록" })).toHaveCount(0);
  await expect(detailHeader.getByText("JH_BLOG")).toHaveCount(0);
  await expect(detailHeader.locator(".article-detail-date-group")).toContainText("분 읽기");
  await expect(detailHeader.locator(".article-detail-date-group")).toContainText("조회");
  await expect(detailHeader.locator(".article-detail-date-group")).toContainText("댓글");
  await expect(detailHeader.locator(".article-detail-meta-row")).not.toContainText("분 읽기");
  await expect(detailHeader.locator(".article-detail-meta-row")).not.toContainText("조회");
  await expect(detailHeader.locator(".article-detail-meta-row")).not.toContainText("댓글");
  const progressbar = page.getByRole("progressbar", { name: "읽기 진행률" });
  await expect(progressbar).toHaveAttribute("aria-valuenow", "0");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(async () => Number(await progressbar.getAttribute("aria-valuenow"))).toBeGreaterThan(50);
  await page.evaluate(() => window.scrollTo(0, 0));
  const firstTocLink = page.locator(".toc-link").first();
  const firstTocHref = await firstTocLink.getAttribute("href");
  await firstTocLink.click();
  await expect.poll(async () => page.evaluate(() => decodeURIComponent(window.location.hash))).toBe(firstTocHref);
  await page.getByRole("button", { name: /E2E 공개 글 링크 복사/ }).click();
  await expect(page.getByRole("button", { name: /E2E 공개 글 링크 복사/ })).toHaveText("복사 완료");

  const stamp = Date.now();
  await page.getByLabel("이름").fill(`테스터${stamp}`);
  await page.getByLabel("비밀번호").fill("1234");
  await page.getByLabel("댓글").fill(`댓글 자동 테스트 ${stamp}`);
  await page.getByRole("button", { name: "댓글 등록" }).click();
  await expect(page.getByText("댓글이 등록되었습니다.")).toBeVisible();
  await expect(
    page.locator("#comments article").filter({ hasText: `댓글 자동 테스트 ${stamp}` }).first()
  ).toBeVisible();
});

test("관리자 대시보드에서 대표 글 캐러셀을 관리할 수 있다", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("featured-admin-panel")).toBeVisible();

  await selectFeaturedPostOption(page, "E2E 공개 글");
  await page.getByRole("button", { name: "대표 글 추가" }).click();
  await expect(page).toHaveURL(/featured=added/);
  await expect(page.getByTestId("featured-admin-item-1")).toContainText("E2E 공개 글");

  await selectFeaturedPostOption(page, "E2E 사진 없는 글");
  await page.getByRole("button", { name: "대표 글 추가" }).click();
  await expect(page.getByTestId("featured-admin-item-2")).toContainText("E2E 사진 없는 글");

  await selectFeaturedPostOption(page, "E2E Pagination Post 1");
  await page.getByRole("button", { name: "대표 글 추가" }).click();
  await expect(page.getByTestId("featured-admin-item-3")).toContainText("E2E Pagination Post 1");
  await expect(page.getByTestId("featured-post-select")).toBeDisabled();

  await page.goto("/");
  const homeCarousel = page.getByTestId("featured-carousel");
  await expect(homeCarousel.locator("h1")).toContainText("E2E 공개 글");
  const coverSlideHeight = await homeCarousel.evaluate((element) => Math.round(element.getBoundingClientRect().height));

  await page.goto("/admin");
  await page.getByTestId("featured-admin-item-1").getByRole("button", { name: "아래로" }).click();
  await expect(page).toHaveURL(/featured=moved/);
  await expect(page.getByTestId("featured-admin-item-1")).toContainText("E2E 사진 없는 글");

  await page.goto("/");
  const textOnlyCarousel = page.getByTestId("featured-carousel");
  await expect(textOnlyCarousel.locator("h1")).toContainText("E2E 사진 없는 글");
  const textOnlySlideHeight = await textOnlyCarousel.evaluate((element) => Math.round(element.getBoundingClientRect().height));
  expect(Math.abs(coverSlideHeight - textOnlySlideHeight)).toBeLessThanOrEqual(2);

  await page.goto("/admin");
  await page.getByTestId("featured-admin-item-1").getByRole("button", { name: "제거" }).click();
  await expect(page).toHaveURL(/featured=removed/);
  await expect(page.getByTestId("featured-admin-item-1")).not.toContainText("E2E 사진 없는 글");
});

test("관리자 로그인, 글 초안 저장, 미리보기가 동작한다", async ({ page }) => {
  await login(page);
  await page.goto("/admin/posts/new");

  const stamp = Date.now();
  await page.getByRole("textbox", { name: "제목" }).fill(`E2E 초안 ${stamp}`);
  await page.getByLabel("요약").fill("E2E 초안 요약입니다.");
  await page.getByLabel("카테고리").fill("E2E");
  await page.getByLabel("태그").fill("E2E, Draft");
  await page.getByLabel("커버").selectOption("none");
  await replaceTextareaValue(page, page.locator("textarea[name='content']"), `# E2E 초안 ${stamp}\n\n초안 미리보기 본문입니다.`);
  await page.getByRole("button", { name: "임시저장" }).click();
  await expect(page).toHaveURL(/\/admin\/posts\?saved=1/);
  await expect(page.getByText(`E2E 초안 ${stamp}`)).toBeVisible();

  const row = page.locator("tr", { hasText: `E2E 초안 ${stamp}` });
  await Promise.all([
    page.waitForURL(/\/admin\/posts\/.+\/preview/),
    row.locator('a[href$="/preview"]').click()
  ]);
  const previewHeader = page.locator("article header").first();
  await expect(previewHeader.locator("h1", { hasText: `E2E 초안 ${stamp}` })).toBeVisible();
  await expect(previewHeader.getByText("JH_BLOG")).toHaveCount(0);
  await expect(previewHeader.locator(".article-detail-date-group")).toContainText("분 읽기");
  await expect(previewHeader.locator(".article-detail-meta-row")).not.toContainText("조회");
});

test("모바일 홈에서 공개 레이아웃 섹션이 겹치지 않고 표시된다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "검색 열기" })).toBeVisible();
  const carousel = page.getByTestId("featured-carousel");
  await expect(carousel.getByText("Featured Article")).toHaveCount(0);
  await expect(carousel.getByRole("link", { name: "대표 글 읽기" })).toHaveCount(0);
  await expect(carousel.getByRole("link", { name: "전체 글 보기" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "전체 아티클" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "인기 있는 글" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "최신 댓글" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "아티클 시리즈" })).toBeVisible();
  await expect(page.getByText("관심 주제")).toHaveCount(0);
  await expect(page.locator("section.sticky.top-16")).toHaveCount(0);
});

test("마크다운 툴바와 에디터 내 이미지 업로드가 동작한다", async ({ page }, testInfo) => {
  await login(page);
  await page.goto("/admin/posts/new");

  const editor = page.locator("textarea[name='content']");
  await replaceTextareaValue(page, editor, "굵게 대상");
  await editor.press("Control+A");
  await page.getByRole("button", { name: "굵게" }).click();
  await expect(editor).toHaveValue("**굵게 대상**");

  await replaceTextareaValue(page, editor, "링크 대상");
  await editor.press("Control+A");
  await page.getByRole("button", { name: "링크" }).click();
  await expect(editor).toHaveValue("[링크 대상](https://example.com)");

  await replaceTextareaValue(page, editor, "console.log('ok');");
  await editor.press("Control+A");
  await page.getByRole("button", { name: "코드블록" }).click();
  await expect(editor).toHaveValue("```\nconsole.log('ok');\n```");

  const stamp = Date.now();
  const slug = `editor-upload-${stamp}`;
  const title = `E2E 에디터 업로드 ${stamp}`;
  await page.getByRole("textbox", { name: "제목" }).fill(title);
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("요약").fill("에디터 내 이미지 업로드 테스트입니다.");
  await page.getByLabel("카테고리").fill("E2E");
  await page.getByLabel("태그").fill("E2E, Editor");
  await page.getByLabel("커버").selectOption({ label: "사진 없음" });
  await replaceTextareaValue(page, editor, `# ${title}\n\n본문 이미지 테스트입니다.`);

  const pngPath = testInfo.outputPath("editor-fixture.png");
  await writeFile(
    pngPath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    )
  );

  await page.getByLabel("본문 이미지 업로드").setInputFiles(pngPath);
  await expect(page.getByText("이미지를 본문에 삽입했습니다.")).toBeVisible();
  await expect(editor).toHaveValue(/!\[editor-fixture\.png\]\(\/uploads\/.+\.png\)/);
  await expect(page.getByTestId("hero-image-option-1")).toBeVisible();
  await page.getByTestId("hero-image-option-1").click();

  await page.getByRole("button", { name: "발행하기" }).click();
  await expect(page).toHaveURL(/\/admin\/posts\?saved=1/);

  await page.goto(`/posts/${slug}`);
  await expect(page.locator("article header h1", { hasText: title })).toBeVisible();
  await expect(page.locator(".article-hero-image img")).toBeVisible();
  await expect(page.locator(".markdown-body img")).toBeVisible();
});

test("모바일 에디터 작성/미리보기 탭이 동작한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/admin/posts/new");

  const editor = page.locator("textarea[name='content']");
  await expect(editor).toBeVisible();
  await page.getByRole("button", { name: "미리보기" }).click();
  await expect(editor).toBeHidden();
  await expect(page.locator(".markdown-body").first()).toBeVisible();
  await page.getByRole("button", { name: "작성" }).click();
  await expect(editor).toBeVisible();
});

test("이미지 업로드와 Markdown 복사가 동작한다", async ({ page }, testInfo) => {
  await login(page);
  await page.goto("/admin/media");

  const pngPath = testInfo.outputPath("fixture.png");
  await writeFile(
    pngPath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64"
    )
  );

  await page.setInputFiles("input[type='file']", pngPath);
  await page.getByRole("button", { name: "업로드" }).click();
  await expect(page.getByText("이미지가 업로드되었습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Markdown 복사" }).first()).toBeVisible();
});

test("관리자 비밀번호를 변경하고 새 비밀번호로 로그인할 수 있다", async ({ page }) => {
  await login(page);
  await page.goto("/admin/settings");

  const nextPassword = `e2e-new-${Date.now()}`;
  await page.getByLabel("현재 비밀번호").fill(adminPassword);
  await page.getByLabel("새 비밀번호", { exact: true }).fill(nextPassword);
  await page.getByLabel("새 비밀번호 확인").fill(nextPassword);
  await page.getByRole("button", { name: "비밀번호 변경" }).click();
  await expect(page.getByText("비밀번호가 변경되었습니다.")).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/admin/login");
  await page.getByLabel("아이디").fill(adminUsername);
  await page.getByLabel("비밀번호").fill(adminPassword);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByText("아이디 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();

  await page.getByLabel("아이디").fill(adminUsername);
  await page.getByLabel("비밀번호").fill(nextPassword);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/admin$/);
});
test("comment edit and delete use modal actions", async ({ page }) => {
  await page.goto("/posts/e2e-published-post");

  const stamp = Date.now();
  const password = "1234";
  const body = `modal comment test ${stamp}`;
  const updatedBody = `modal comment updated ${stamp}`;
  const comments = page.locator("#comments");
  const form = comments.locator("form.comment-form");

  await form.locator('input[name="author"]').fill(`modal-user-${stamp}`);
  await form.locator('input[name="password"]').fill(password);
  await form.locator('textarea[name="body"]').fill(body);
  await form.locator('button[type="submit"]').click();

  const createdComment = page.locator("#comments article").filter({ hasText: body }).first();
  await expect(createdComment).toBeVisible();
  await expect(createdComment.locator(".comment-action-panel")).toHaveCount(0);

  await createdComment.locator('[data-testid^="comment-actions-"]').click();
  let dialog = page.getByTestId("comment-action-dialog");
  await expect(dialog).toBeVisible();
  const overlayStyle = await page.getByTestId("comment-action-overlay").evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backdropFilter: style.backdropFilter
    };
  });
  expect(overlayStyle.backgroundColor).toBe("rgba(15, 23, 42, 0.36)");
  expect(overlayStyle.backdropFilter).toBe("blur(12px)");
  await dialog.getByTestId("comment-edit-open").click();
  await dialog.locator('textarea[name="body"]').fill(`wrong password edit ${stamp}`);
  await dialog.locator('input[name="password"]').fill("wrong-password");
  await dialog.locator('form button[type="submit"]').click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("comment-action-error")).toHaveCount(0);
  await expect(page.getByTestId("comment-toast")).toContainText("비밀번호");
  const toastBox = await page.getByTestId("comment-toast").boundingBox();
  const viewportSize = page.viewportSize();
  expect(toastBox?.y).toBeLessThan(80);
  expect(Math.abs((toastBox?.x || 0) + (toastBox?.width || 0) / 2 - (viewportSize?.width || 0) / 2)).toBeLessThan(8);

  await dialog.locator('textarea[name="body"]').fill(updatedBody);
  await dialog.locator('input[name="password"]').fill(password);
  await dialog.locator('form button[type="submit"]').click();

  const updatedComment = page.locator("#comments article").filter({ hasText: updatedBody }).first();
  await expect(updatedComment).toBeVisible();
  await expect(page.getByTestId("comment-toast")).toContainText("수정");

  await updatedComment.locator('[data-testid^="comment-actions-"]').click();
  dialog = page.getByTestId("comment-action-dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByTestId("comment-delete-open").click();
  await dialog.locator('input[name="password"]').fill("wrong-password");
  await dialog.locator('form button[type="submit"]').click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("comment-action-error")).toHaveCount(0);
  await expect(page.getByTestId("comment-toast")).toContainText("비밀번호");

  await dialog.locator('input[name="password"]').fill(password);
  await dialog.locator('form button[type="submit"]').click();

  await expect(page.locator("#comments article").filter({ hasText: updatedBody })).toHaveCount(0);
  await expect(page.getByTestId("comment-toast")).toContainText("삭제");
});
