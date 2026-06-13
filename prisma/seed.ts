import { PrismaClient, PostStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminUsername = process.env.ADMIN_USERNAME || "jh_admin";
const adminPassword = process.env.ADMIN_PASSWORD || "change-this-password";

async function upsertCategory(name: string, slug: string, description?: string) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, description },
    create: { name, slug, description }
  });
}

async function upsertTag(name: string, slug: string) {
  return prisma.tag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug }
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash, passwordUpdatedAt: new Date() },
    create: { username: adminUsername, passwordHash, passwordUpdatedAt: new Date() }
  });

  const development = await upsertCategory("개발", "development", "개발 기록과 제품 구현 노트");
  const til = await upsertCategory("TIL", "til", "오늘 배운 것과 짧은 실험");
  const retrospective = await upsertCategory("회고", "retrospective", "운영 경험과 개선 기록");

  const tagMap = new Map<string, { id: string }>();
  for (const [name, slug] of [
    ["Admin UX", "admin-ux"],
    ["Design System", "design-system"],
    ["Markdown", "markdown"],
    ["Editor", "editor"],
    ["Comments", "comments"],
    ["Personal Blog", "personal-blog"],
    ["Next.js", "nextjs"]
  ]) {
    const tag = await upsertTag(name, slug);
    tagMap.set(slug, tag);
  }

  const posts = [
    {
      title: "혼자 운영하는 블로그를 위한 관리자 경험 설계",
      slug: "admin-dashboard-ux",
      excerpt: "글쓰기, 댓글, 통계를 한 사람이 부담 없이 관리할 수 있도록 화면 흐름을 정리합니다.",
      categoryId: development.id,
      tagSlugs: ["admin-ux", "design-system", "personal-blog"],
      cover: "admin",
      views: 1284,
      createdAt: new Date("2026-06-12T09:00:00.000Z"),
      content: `# 혼자 운영하는 블로그를 위한 관리자 경험 설계

개인 블로그의 관리 화면은 많은 기능을 한 번에 보여주기보다, 오늘 처리해야 할 일과 최근 반응을 빠르게 확인하게 만드는 것이 중요합니다.

## 관리자가 자주 보는 정보

조회수, 발행 글 수, 댓글 수, 인기 글은 대시보드 첫 화면에서 바로 읽혀야 합니다. 색은 핵심 상태에만 쓰고, 대부분의 위계는 간격과 타이포그래피로 만듭니다.

## 작성 흐름

글 작성기는 PC에서는 마크다운과 미리보기를 나란히 보여주고, 모바일에서는 작성과 미리보기를 탭으로 전환합니다.

\`\`\`ts
const post = await getPost(slug);
return renderArticle(post, comments);
\`\`\`

## 다음 작업

초안 저장, 댓글 관리, 조회수 확인이 한 화면에서 자연스럽게 이어지면 혼자 운영하는 블로그도 훨씬 가벼워집니다.`
    },
    {
      title: "마크다운 에디터에서 미리보기 질감 높이기",
      slug: "markdown-editor-preview",
      excerpt: "작성 중에도 실제 글 상세 화면과 비슷하게 읽히도록 에디터와 프리뷰의 리듬을 맞춥니다.",
      categoryId: til.id,
      tagSlugs: ["markdown", "editor"],
      cover: "markdown",
      views: 764,
      createdAt: new Date("2026-06-10T08:30:00.000Z"),
      content: `# 마크다운 에디터에서 미리보기 질감 높이기

좋은 작성기는 입력하는 동안 결과를 상상하게 만들지 않습니다. 미리보기가 실제 글 상세 화면과 가까울수록 수정 판단이 빨라집니다.

## 데스크톱

- 왼쪽은 마크다운 작성
- 오른쪽은 미리보기
- 상단 메타 정보와 발행 버튼은 고정

## 모바일

모바일에서는 두 패널을 억지로 나누지 않고, 작성과 미리보기를 탭으로 전환합니다.`
    },
    {
      title: "댓글 수정 흐름을 너무 무겁지 않게 만들기",
      slug: "comment-password-flow",
      excerpt: "개인 블로그의 댓글은 빠르게 남기고, 비밀번호로 필요한 수정과 삭제만 할 수 있으면 충분합니다.",
      categoryId: retrospective.id,
      tagSlugs: ["comments", "personal-blog"],
      cover: "comment",
      views: 512,
      createdAt: new Date("2026-06-08T11:00:00.000Z"),
      content: `# 댓글 수정 흐름을 너무 무겁지 않게 만들기

혼자 운영하는 블로그에는 복잡한 커뮤니티 관리 도구가 필요하지 않습니다. 최근 댓글, 삭제, 비밀번호 기반 수정 정도면 충분합니다.

## 원칙

댓글은 글을 읽는 흐름을 방해하지 않아야 합니다. 입력은 간단하게, 관리는 대시보드에서 빠르게 처리합니다.`
    }
  ];

  const commentPasswordHash = await bcrypt.hash("1234", 12);

  for (const seedPost of posts) {
    const post = await prisma.post.upsert({
      where: { slug: seedPost.slug },
      update: {
        title: seedPost.title,
        excerpt: seedPost.excerpt,
        content: seedPost.content,
        cover: seedPost.cover,
        views: seedPost.views,
        status: PostStatus.PUBLISHED,
        publishedAt: seedPost.createdAt,
        createdAt: seedPost.createdAt,
        categoryId: seedPost.categoryId
      },
      create: {
        title: seedPost.title,
        slug: seedPost.slug,
        excerpt: seedPost.excerpt,
        content: seedPost.content,
        cover: seedPost.cover,
        views: seedPost.views,
        status: PostStatus.PUBLISHED,
        publishedAt: seedPost.createdAt,
        createdAt: seedPost.createdAt,
        categoryId: seedPost.categoryId
      }
    });

    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    for (const tagSlug of seedPost.tagSlugs) {
      const tag = tagMap.get(tagSlug);
      if (tag) {
        await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
      }
    }
  }

  const adminPost = await prisma.post.findUnique({ where: { slug: "admin-dashboard-ux" } });
  const editorPost = await prisma.post.findUnique({ where: { slug: "markdown-editor-preview" } });

  if (adminPost) {
    await prisma.comment.deleteMany({ where: { postId: adminPost.id } });
    await prisma.comment.createMany({
      data: [
        {
          postId: adminPost.id,
          author: "민수",
          body: "대시보드 구성이 깔끔해서 참고가 됩니다.",
          passwordHash: commentPasswordHash,
          createdAt: new Date("2026-06-12T10:00:00.000Z")
        },
        {
          postId: adminPost.id,
          author: "수연",
          body: "모바일 작성 탭 흐름도 궁금해요.",
          passwordHash: commentPasswordHash,
          createdAt: new Date("2026-06-12T10:20:00.000Z")
        }
      ],
      skipDuplicates: true
    });
  }

  if (editorPost) {
    await prisma.comment.deleteMany({ where: { postId: editorPost.id } });
    await prisma.comment.createMany({
      data: [
        {
          postId: editorPost.id,
          author: "JH",
          body: "미리보기 타이포그래피까지 맞추는 게 핵심이더라고요.",
          passwordHash: commentPasswordHash,
          createdAt: new Date("2026-06-10T12:00:00.000Z")
        }
      ],
      skipDuplicates: true
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
