# Repo và Skills đã đối chiếu từ GitHub/chính thức (22/11/2026)

## Ưu tiên cài/sử dụng

1. **google-gemini/gemini-cli** — `Gemini CLI subagents`, `GEMINI.md`, `gemini skills`. Official: https://github.com/google-gemini/gemini-cli ; docs https://geminicli.com/docs/core/subagents/ . Thư mục `.gemini/agents` và `.gemini/skills`.
2. **anthropics/skills** — `frontend-design` official skill: https://github.com/anthropics/skills/tree/main/skills/frontend-design . Phù hợp nhìn tổng thể visual identity nhưng cần bám game pixel, không dùng UI web marketing mặc định.
3. **vercel-labs/agent-skills** — `web-design-guidelines`: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines ; audit accessibility, UI quality.
4. **phaserjs/phaser** — official game engine and Phaser 4-oriented skills `game-setup-and-config`, `scale-and-responsive`: https://github.com/phaserjs/phaser/tree/master/skills ; dùng tri thức concept và kiểm tra API tương thích Phaser 3 của project, tuyệt đối không copy config v4 sang v3 không test.
5. **phaserjs/examples** — mã ví dụ Phaser 3 đúng đời dự án: https://github.com/phaserjs/examples . Nên ưu tiên khi kiểm tra API `Scene`, animation, zoom, origins.
6. **vercel-labs/skills** — skill package manager và `find-skills`: https://github.com/vercel-labs/skills ; tra thêm skills qua https://skills.sh/ .
7. **microsoft/playwright** — test touch / mobile / keyboard: https://github.com/microsoft/playwright ; https://playwright.dev/docs/emulation .
8. **microsoft/Web-Dev-For-Beginners** — nội dung học web open curriculum, không phải từ điển CEFR đầy đủ: https://github.com/microsoft/Web-Dev-For-Beginners .
9. **OWASP/cheatsheetseries** — bảo mật backend/auth: https://github.com/OWASP/CheatSheetSeries .
10. **docker/compose** — Docker Compose tooling & docs: https://github.com/docker/compose .
11. **Kenney** — free game assets tìm bằng `Kenney UI Pack pixel`/`Kenney pixel UI pack`; kiểm tra license per asset trước khi đưa vào game. https://kenney.nl/assets/pixel-ui-pack (CC0 tại trang nguồn).

## Lệnh tìm/khai thác (chạy trong terminal khi internet)
```
npx skills find pixel art
npx skills find phaser responsive
npx skills find mobile ui ux
npx skills find accessibility
npx skills find playwright testing
npx skills add https://github.com/anthropics/skills --skill frontend-design
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
# Gemini CLI có chức năng cài skill riêng, xem cú pháp phiên bản cài trên máy:
gemini skills --help
gemini skills install --help
```

## Download only if needed
- REQUIRED NOW: source project existing, official Phaser docs / skill docs, frontend-design, web-design-guidelines, Playwright. **Pack này đã có custom skills**, nên không bắt buộc clone cả repo lớn.
- OPTIONAL LATER: Kenney asset pack/license; Piskel, LibreSprite/Aseprite để normalize animation frames; Docker repo docs; Vercel example.
- Avoid blindly installing third-party skills: inspect SKILL.md, scripts, permissions, lock versions, origin and license. No blind `curl | bash` on unknown source.

## Educational references
- https://www.oxfordlearnersdictionaries.co.uk/about/wordlists/cefr
- https://developer.mozilla.org/en-US/docs/Glossary
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- https://englishprofile.org/?menu=english-vocabulary-profile (English Vocabulary Profile từ A1 tới C2; quyền sử dụng dữ liệu phải được kiểm tra)
- https://strategywiki.org/wiki/Bookworm_Adventures/Gameplay (mechanics reference only)

## Keywords user can search on GitHub
`google-gemini gemini-cli agents` · `anthropics skills frontend-design` · `vercel-labs web-design-guidelines` · `phaserjs phaser scale-and-responsive skill` · `Playwright mobile emulation` · `phaser sprite origin foot anchor pixel art` · `pixel art nine slice UI CC0` · `Kenney UI Pack` · `English Vocabulary Profile CEFR corpus licensing` · `CNCF cloud native glossary` · `Docker Compose Spring Boot SQL Server` · `Vercel Services Dockerfile.vercel`.
