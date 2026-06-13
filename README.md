# JH_BLOG

Next.js App Router, Prisma, PostgreSQL 기반 개인 블로그 웹앱입니다.

## 기술 스택

- Next.js 16, React 19, TypeScript
- Emotion, Framer Motion, lucide-react
- Prisma, PostgreSQL
- Markdown 렌더링: react-markdown, remark-gfm, rehype-sanitize, rehype-highlight, rehype-slug
- E2E 테스트: Playwright

## 주요 기능

- 공개 홈, 글 상세, 카테고리/태그 탐색
- Toss Tech 참고형 대표 글 캐러셀, 검색 모달, 페이지네이션
- 라이트/다크 모드
- 글 읽기 진행률, 목차 이동, 공유 버튼
- 방문자 댓글 작성, 비밀번호 기반 수정/삭제
- 댓글 수정/삭제 모달과 토스트 피드백
- 관리자 로그인과 `/admin/**` 보호
- 관리자 글 작성/수정/삭제, 임시저장/발행
- Markdown 에디터, 미리보기, 이미지 업로드, 대표이미지 선택
- 대표 글 캐러셀 관리, 댓글/미디어/카테고리/태그/통계 관리
- RSS, sitemap, robots.txt

## 시작하기

```bash
pnpm install
copy .env.example .env
docker compose -p jh_blog up -d db
pnpm prisma:migrate -- --name init
pnpm prisma:seed
pnpm dev -- -p 3000
```

기본 개발 주소는 `http://localhost:3000`입니다.

## 환경 변수

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `ADMIN_USERNAME`: 초기 관리자 아이디
- `ADMIN_PASSWORD`: 초기 관리자 비밀번호
- `SESSION_SECRET`: 32자 이상의 세션 서명 비밀값
- `UPLOAD_DIR`: 업로드 이미지 저장 폴더
- `NEXT_PUBLIC_SITE_URL`: 공개 사이트 주소

## 검증

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test:e2e
```

E2E 테스트는 `prisma/e2e-seed.ts`로 테스트용 관리자와 글을 준비한 뒤 실행합니다.

## 백업/복구

```bash
pnpm db:backup
pnpm db:restore
```

운영 시 백업 대상은 PostgreSQL 데이터와 `UPLOAD_DIR`에 저장된 업로드 이미지입니다.
