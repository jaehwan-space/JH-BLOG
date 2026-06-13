import { PrismaClient, PostStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const E2E_ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "jh_e2e_admin";
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "e2e-password-1234";
const E2E_POST_CONTENT = `# E2E 공개 글

댓글과 공개 화면 테스트에 사용합니다.

## 첫 번째 섹션

스크롤 진행률을 검증하기 위해 본문을 충분히 길게 유지합니다. 글 상세 화면은 제목, 메타 정보, 본문, 댓글을 함께 보여주며 읽는 흐름이 깨지지 않아야 합니다.

## 두 번째 섹션

마크다운 렌더링은 문단, 목록, 코드블록, 인용문이 섞여도 안정적으로 보여야 합니다.

- 공개 글 렌더링
- 댓글 작성
- 읽기 진행률

## 세 번째 섹션

> 읽는 위치를 보여주는 얇은 진행률 바는 본문을 가리지 않고 자연스럽게 움직여야 합니다.

## 네 번째 섹션

\`\`\`ts
const status = "published";
console.log(status);
\`\`\`

## 다섯 번째 섹션

마지막 섹션까지 스크롤할 수 있어야 진행률이 100%에 가까워집니다. 이 본문은 자동 테스트에서만 사용하는 콘텐츠입니다.`;

async function main() {
  await prisma.featuredPost.deleteMany();

  const passwordHash = await bcrypt.hash(E2E_ADMIN_PASSWORD, 12);
  await prisma.adminUser.upsert({
    where: { username: E2E_ADMIN_USERNAME },
    update: { passwordHash, passwordUpdatedAt: new Date() },
    create: {
      username: E2E_ADMIN_USERNAME,
      passwordHash,
      passwordUpdatedAt: new Date()
    }
  });

  const category = await prisma.category.upsert({
    where: { slug: "e2e" },
    update: { name: "E2E" },
    create: { name: "E2E", slug: "e2e", description: "자동 테스트용 카테고리" }
  });

  const tag = await prisma.tag.upsert({
    where: { slug: "e2e" },
    update: { name: "E2E" },
    create: { name: "E2E", slug: "e2e" }
  });

  const post = await prisma.post.upsert({
    where: { slug: "e2e-published-post" },
    update: {
      title: "E2E 공개 글",
      excerpt: "자동 테스트에서 사용하는 공개 글입니다.",
      content: E2E_POST_CONTENT,
      cover: "blog",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-06-12T00:00:00.000Z"),
      categoryId: category.id
    },
    create: {
      title: "E2E 공개 글",
      slug: "e2e-published-post",
      excerpt: "자동 테스트에서 사용하는 공개 글입니다.",
      content: E2E_POST_CONTENT,
      cover: "blog",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-06-12T00:00:00.000Z"),
      categoryId: category.id
    }
  });

  await prisma.postTag.upsert({
    where: { postId_tagId: { postId: post.id, tagId: tag.id } },
    update: {},
    create: { postId: post.id, tagId: tag.id }
  });

  const textOnlyPost = await prisma.post.upsert({
    where: { slug: "e2e-text-only-post" },
    update: {
      title: "E2E 사진 없는 글",
      excerpt: "썸네일 없이 텍스트만으로 자연스럽게 표시되는 글입니다.",
      content: "# E2E 사진 없는 글\n\n이미지 없이도 글 목록에서 자연스럽게 읽혀야 합니다.",
      cover: "none",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-06-11T00:00:00.000Z"),
      categoryId: category.id
    },
    create: {
      title: "E2E 사진 없는 글",
      slug: "e2e-text-only-post",
      excerpt: "썸네일 없이 텍스트만으로 자연스럽게 표시되는 글입니다.",
      content: "# E2E 사진 없는 글\n\n이미지 없이도 글 목록에서 자연스럽게 읽혀야 합니다.",
      cover: "none",
      status: PostStatus.PUBLISHED,
      publishedAt: new Date("2026-06-11T00:00:00.000Z"),
      categoryId: category.id
    }
  });

  await prisma.postTag.upsert({
    where: { postId_tagId: { postId: textOnlyPost.id, tagId: tag.id } },
    update: {},
    create: { postId: textOnlyPost.id, tagId: tag.id }
  });

  for (let index = 1; index <= 6; index += 1) {
    const extraPost = await prisma.post.upsert({
      where: { slug: `e2e-pagination-post-${index}` },
      update: {
        title: `E2E Pagination Post ${index}`,
        excerpt: "Pagination coverage post for the public home article list.",
        content: `# E2E Pagination Post ${index}\n\nThis post keeps the public article list long enough for pagination tests.`,
        cover: index % 2 === 0 ? "blog" : "none",
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(`2026-06-${String(10 - index).padStart(2, "0")}T00:00:00.000Z`),
        categoryId: category.id
      },
      create: {
        title: `E2E Pagination Post ${index}`,
        slug: `e2e-pagination-post-${index}`,
        excerpt: "Pagination coverage post for the public home article list.",
        content: `# E2E Pagination Post ${index}\n\nThis post keeps the public article list long enough for pagination tests.`,
        cover: index % 2 === 0 ? "blog" : "none",
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(`2026-06-${String(10 - index).padStart(2, "0")}T00:00:00.000Z`),
        categoryId: category.id
      }
    });

    await prisma.postTag.upsert({
      where: { postId_tagId: { postId: extraPost.id, tagId: tag.id } },
      update: {},
      create: { postId: extraPost.id, tagId: tag.id }
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
