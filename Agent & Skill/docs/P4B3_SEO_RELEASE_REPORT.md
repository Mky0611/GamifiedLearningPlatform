# LEX RAID — P4-B.3 SEO & PRODUCTION RELEASE REPORT

**Domain Production:** `https://gamified-learning-platform-sandy.vercel.app/`  
**Deployment ID mới (READY):** `dpl_HsUgDxCtZ6TkdBKsadrYqRD8PR2m` (`https://gamified-learning-platform-qan3kqo7b-mky0624.vercel.app`)  
**Rollback Production Deployment ID giữ nguyên:** `dpl_6Y5RBeGt29g2QvEU59ccvvFa2kPk`  
**Nhánh phát hành:** `feature/p4b3-rpg-combat-learning` (verified code SHA `5d8ecaa`, doc sync `9916513`)

---

## 1. KIẾN TRÚC SEO & ROUTING

- **Canonical Origin:** Toàn bộ URL công khai chuẩn hóa duy nhất về `https://gamified-learning-platform-sandy.vercel.app`. Không chứa Preview URL hay `localhost` trong `<link rel="canonical">`, `og:url`, `sitemap.xml` hoặc `robots.txt`.
- **Canonical `/` vs `/app/home`:**
  - `https://gamified-learning-platform-sandy.vercel.app/` là canonical URL chính của Trang chủ.
  - `/app` và `/app/` redirect vĩnh viễn (`permanent: true`) về `/`.
  - `/app/home` giữ tương thích điều hướng nhưng khai báo `<link rel="canonical" href="https://gamified-learning-platform-sandy.vercel.app/">` để tránh phân mảnh trùng lặp.
- **Phân tầng Indexable vs Noindex:**
  - **Index (`7` URL trong `sitemap.xml`):** `/`, `/app/minigame`, `/app/volcard`, `/app/quiz`, `/app/memory`, `/app/speed-math`, `/app/code-puzzle`.
  - **Noindex (`<meta name="robots" content="noindex, nofollow">`):** `/app/account`, `/app/auth`, `/app/typography`, `/404.html`. `robots.txt` để `Allow: /` (không dùng `Disallow` chặn các URL public noindex và không coi `robots.txt` là cơ chế bảo mật) nhằm giúp crawler đọc trực tiếp thẻ `noindex`.
- **404 Handling:** Đường dẫn không khớp rewrite trả về mã HTTP `404` thực tế (không trả về HTTP `200` của Home), kèm trang `404.html`.
- **Rich Metadata & Schema.org:** Mỗi trang indexable có `<title>` & `<meta name="description">` riêng, `og:image` (`1200×630` `assets/imgs/og-preview.png`), `twitter:card=summary_large_image`, và JSON-LD (`WebSite`/`EducationalApplication`, `VideoGame`, `LearningResource`) hợp lệ.

---

## 2. XÁC MINH TRỰC TIẾP TRÊN PRODUCTION (`https://gamified-learning-platform-sandy.vercel.app/`)

- **HTTP Probe (`vercel inspect` + public HTTPS GET):**
  - `/`: `200` (`8,881` bytes)
  - `/app/home`: `200` (`8,881` bytes)
  - `/app/minigame`: `200` (`18,726` bytes)
  - `/app/volcard`: `200` (`9,790` bytes)
  - `/robots.txt`: `200` (`166` bytes)
  - `/sitemap.xml`: `200` (`1,472` bytes)
  - `/ui/assets/data/build-info.json`: `200` (`304` bytes — `codeCommit: "5d8ecaa"`, `release: "P4-B.3-release"`)
  - `/ui/assets/imgs/og-preview.png`: `200` (`93,313` bytes PNG)
  - `/nonexistent-prod-404-check`: `404` (`NOT_FOUND`)
- **Live Headless Chromium Verification (`verify_prod_live.js`):**
  - Home Daylight (`overflow=false`, `h1=1`, `canon="https://gamified-learning-platform-sandy.vercel.app/"`) & Home Moonlight (`overflow=false`, `theme="moonlight"`).
  - Battle Arena Desktop & Mobile (`qaHookExposed: false`, `tiles: 25`, `skills: 6`, `wave: "Wave 1/5"`, `hasCanvas: true`, `overflow=false`).
  - Volcard Moonlight (`word: "polymorphism"`, `theme: "moonlight"`, `h1=1`).
