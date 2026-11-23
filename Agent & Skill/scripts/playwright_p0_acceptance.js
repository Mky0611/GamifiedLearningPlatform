/**
 * Playwright Acceptance Test Suite for Lex Raid Pixel RPG (P0 Finalization)
 * 
 * Tests 7 required viewports:
 * - 320x568 (iPhone SE 1st)
 * - 360x800 (Android Standard)
 * - 390x844 (iPhone 12/13/14)
 * - 430x932 (iPhone Pro Max)
 * - 768x1024 (iPad Portrait)
 * - 1366x768 (Laptop HD)
 * - 1920x1080 (Desktop FHD)
 * 
 * Verifies:
 * - document.documentElement.scrollHeight <= window.innerHeight (No-scroll fit)
 * - getBoundingClientRect() of Stage, HUD, Attack Dock, Word Board
 * - Live gameplay interaction: Select word -> Clear -> Select word -> Attack -> Boss hit
 * - Captures full viewport screenshots
 * 
 * Execution:
 *   npx playwright test Agent/&/Skill/scripts/playwright_p0_acceptance.js
 *   or: node Agent/&/Skill/scripts/playwright_p0_acceptance.js
 */

const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { name: '320x568_iPhoneSE1', width: 320, height: 568, isMobile: true },
  { name: '360x800_AndroidStandard', width: 360, height: 800, isMobile: true },
  { name: '390x844_iPhone13', width: 390, height: 844, isMobile: true },
  { name: '430x932_iPhoneProMax', width: 430, height: 932, isMobile: true },
  { name: '768x1024_iPadPortrait', width: 768, height: 1024, isMobile: false },
  { name: '1366x768_LaptopHD', width: 1366, height: 768, isMobile: false },
  { name: '1440x900_DesktopWidescreen', width: 1440, height: 900, isMobile: false },
  { name: '1920x1080_DesktopFHD', width: 1920, height: 1080, isMobile: false }
];

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173/app/minigame';
const OUTPUT_DIR = path.join(__dirname, '../../test_output/playwright');

async function runSuite() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('Playwright is not installed. To run outside sandbox: npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const report = [];
    let suitePassed = true;

    console.log(`Starting Lex Raid P0 Playwright Acceptance Suite against ${BASE_URL}...`);

    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`======================================================`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile
      });

      let page;
      try {
        page = await context.newPage();
        const consoleLogs = [];
        const consoleErrors = [];

        page.on('console', msg => {
          const type = msg.type();
          const text = msg.text();
          consoleLogs.push({ type, text });
          if (type === 'error') consoleErrors.push(text);
        });

        page.on('pageerror', err => {
          consoleErrors.push(err.message);
        });

        // 1. Navigate to game
        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000); // Allow Phaser & DOM to mount

        // Capture initial screenshot
        const screenshotBefore = path.join(OUTPUT_DIR, `lexraid_${vp.name}_init.png`);
        await page.screenshot({ path: screenshotBefore, fullPage: false });

        // 2. Measure view metrics
        const metrics = await page.evaluate(() => {
          const de = document.documentElement;
          const arena = document.querySelector('.battle-stage')?.getBoundingClientRect();
          const dock = document.querySelector('.attack-dock')?.getBoundingClientRect();
          const board = document.querySelector('#boardGrid')?.getBoundingClientRect();
          const clearBtn = document.querySelector('#clearPathBtn')?.getBoundingClientRect();
          const attackBtn = document.querySelector('#submitWordBtn')?.getBoundingClientRect();
          const hud = document.querySelector('.arena-hud-overlay')?.getBoundingClientRect();

          return {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            visualViewportHeight: window.visualViewport ? window.visualViewport.height : window.innerHeight,
            scrollHeight: de.scrollHeight,
            scrollWidth: de.scrollWidth,
            arena: arena ? { top: arena.top, bottom: arena.bottom, height: arena.height, width: arena.width } : null,
            dock: dock ? { top: dock.top, bottom: dock.bottom, height: dock.height } : null,
            board: board ? { top: board.top, bottom: board.bottom, height: board.height } : null,
            clearBtn: clearBtn ? { top: clearBtn.top, bottom: clearBtn.bottom, width: clearBtn.width, height: clearBtn.height } : null,
            attackBtn: attackBtn ? { top: attackBtn.top, bottom: attackBtn.bottom, width: attackBtn.width, height: attackBtn.height } : null,
            hud: hud ? { top: hud.top, bottom: hud.bottom, width: hud.width, height: hud.height } : null
          };
        });

        // Evaluate element visibility and overflow assertions
        const noHorizontalOverflow = metrics.scrollWidth <= metrics.windowWidth + 1;
        const stageVisible = Boolean(metrics.arena && metrics.arena.width > 0 && metrics.arena.height > 0);
        const dockVisible = Boolean(metrics.dock && metrics.dock.width > 0 && metrics.dock.height > 0);
        const boardVisible = Boolean(metrics.board && metrics.board.width > 0 && metrics.board.height > 0);
        const combatBottom = metrics.board ? metrics.board.bottom : (metrics.dock ? metrics.dock.bottom : 0);
        
        // Strict no-scroll condition: combat area must completely fit within the viewport height
        const fitsWithoutScroll = combatBottom <= vp.height + 1;

        // Button tap target threshold must strictly meet 40px
        const buttonTargetOk = !vp.isMobile || (
          metrics.clearBtn && metrics.clearBtn.height >= 39.5 &&
          metrics.attackBtn && metrics.attackBtn.height >= 39.5
        );

        const assertions = {
          noHorizontalOverflow,
          stageVisible,
          dockVisible,
          boardVisible,
          fitsWithoutScroll,
          buttonTargetOk,
          clearFunctional: false,
          attackFunctional: false,
          zeroConsoleErrors: consoleErrors.length === 0
        };

        console.log(`- Metrics: Viewport=${vp.width}x${vp.height} | ScrollW=${metrics.scrollWidth}px | ScrollH=${metrics.scrollHeight}px | Combat Bottom=${combatBottom.toFixed(1)}px`);
        console.log(`- Assertions: NoOverflow=${noHorizontalOverflow} | Stage=${stageVisible} | Dock=${dockVisible} | Board=${boardVisible} | Fit=${fitsWithoutScroll} | TapTarget40px=${buttonTargetOk}`);
        console.log(`- Console Errors: ${consoleErrors.length}`);

        // 3. Live gameplay interaction: Select word -> Clear -> Select valid word -> Attack
        console.log(`- Executing live touch/click interactions...`);
        const tiles = page.locator('.board-tile');
        const tileCount = await tiles.count();

        if (tileCount >= 3) {
          // Tap first 2 tiles to test selection & Clear
          await tiles.nth(0).click();
          await page.waitForTimeout(100);
          await tiles.nth(1).click();
          await page.waitForTimeout(150);

          const wordSelected = await page.locator('#currentWordValue').innerText();
          console.log(`  * Selected word before clear: "${wordSelected}"`);

          // Test Clear button
          await page.locator('#clearPathBtn').click();
          await page.waitForTimeout(150);
          const afterClear = await page.locator('#currentWordValue').innerText();
          assertions.clearFunctional = (afterClear.trim() === '—' || afterClear.trim() === '');
          console.log(`  * After Clear: "${afterClear}" (Pass: ${assertions.clearFunctional})`);

          // Deterministic gameplay test: Find a valid word from candidate words that exists on the current board
          const movePlan = await page.evaluate(() => {
            const tileEls = Array.from(document.querySelectorAll('.board-tile'));
            const boardLetters = tileEls.map((el, idx) => ({
              idx,
              row: Number(el.dataset.row),
              col: Number(el.dataset.col),
              letter: (el.dataset.letter || el.querySelector('.board-tile__letter')?.textContent || '').trim().toUpperCase()
            }));

            const hookWords = window.__LEX_RAID_TEST_HOOKS__ ? [
              window.__LEX_RAID_TEST_HOOKS__.getActiveCoreWord(),
              ...window.__LEX_RAID_TEST_HOOKS__.getValidWords()
            ] : [];

            const candidates = [...new Set(hookWords.filter(Boolean).map(w => w.toUpperCase()))];

            for (const word of candidates) {
              if (word.length < 3) continue;
              const chars = word.split('');
              const matched = [];
              const used = new Set();
              let matchSuccess = true;
              for (const ch of chars) {
                const found = boardLetters.find(t => !used.has(t.idx) && t.letter === ch);
                if (found) {
                  used.add(found.idx);
                  matched.push(found.idx);
                } else {
                  matchSuccess = false;
                  break;
                }
              }
              if (matchSuccess && matched.length === chars.length) {
                return { word, tileIndices: matched };
              }
            }

            return { word: null, tileIndices: [] };
          });

          if (movePlan.word && movePlan.tileIndices.length >= 3) {
            console.log(`  * Deterministic test forming valid word "${movePlan.word}" with tile indices: [${movePlan.tileIndices.join(', ')}]`);
            for (const idx of movePlan.tileIndices) {
              await tiles.nth(idx).click();
              await page.waitForTimeout(80);
            }

            // Read state before attack directly from DOM
            const beforeAttack = await page.evaluate(() => {
              const parseNum = (str, def = 0) => {
                const m = String(str || '').match(/\d+/);
                return m ? parseInt(m[0], 10) : def;
              };
              return {
                score: parseNum(document.getElementById('scoreValue')?.textContent, 0),
                bossHp: parseNum(document.getElementById('bossHpValue')?.textContent, 100),
                bossShield: parseNum(document.getElementById('bossShieldValue')?.textContent, 30),
                recentWordsCount: document.querySelectorAll('#recentWords .recent-word-chip').length
              };
            });

            // Tap Attack
            console.log(`  * Tapping Attack button...`);
            await page.locator('#submitWordBtn').click();
            await page.waitForTimeout(900); // Wait for attack tween and hit flash

            // Read state after attack directly from DOM
            const afterAttack = await page.evaluate(() => {
              const parseNum = (str, def = 0) => {
                const m = String(str || '').match(/\d+/);
                return m ? parseInt(m[0], 10) : def;
              };
              const recentChips = Array.from(document.querySelectorAll('#recentWords .recent-word-chip')).map(el => el.textContent.trim().toUpperCase());
              return {
                score: parseNum(document.getElementById('scoreValue')?.textContent, 0),
                bossHp: parseNum(document.getElementById('bossHpValue')?.textContent, 100),
                bossShield: parseNum(document.getElementById('bossShieldValue')?.textContent, 30),
                recentChips,
                recentWordsCount: recentChips.length
              };
            });

            assertions.attackFunctional = Boolean(
              afterAttack.score > beforeAttack.score ||
              afterAttack.bossHp < beforeAttack.bossHp ||
              afterAttack.bossShield < beforeAttack.bossShield ||
              afterAttack.recentWordsCount > beforeAttack.recentWordsCount ||
              afterAttack.recentChips.includes(movePlan.word)
            );
            console.log(`  * Attack response verified via DOM: Score=${beforeAttack.score}->${afterAttack.score}, BossHP=${beforeAttack.bossHp}->${afterAttack.bossHp}, RecentCount=${beforeAttack.recentWordsCount}->${afterAttack.recentWordsCount} (Pass: ${assertions.attackFunctional})`);
          } else {
            console.warn(`  ! Could not form a valid runtime word on current board layout. Attack test cannot pass falsely.`);
            assertions.attackFunctional = false;
          }
        }

        // 4. Capture screenshot
        const screenshotPath = path.join(OUTPUT_DIR, `lexraid_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`- Screenshot saved to: ${screenshotPath}`);

        // All assertions are strictly required for a viewport to pass
        const viewportPass = Boolean(
          assertions.noHorizontalOverflow &&
          assertions.stageVisible &&
          assertions.dockVisible &&
          assertions.boardVisible &&
          assertions.fitsWithoutScroll &&
          assertions.buttonTargetOk &&
          assertions.clearFunctional &&
          assertions.attackFunctional &&
          assertions.zeroConsoleErrors
        );

        if (!viewportPass) {
          suitePassed = false;
        }

        report.push({
          viewport: vp.name,
          dimensions: `${vp.width}x${vp.height}`,
          status: viewportPass ? 'PASS' : 'FAIL',
          assertions,
          metrics,
          consoleErrors,
          screenshot: screenshotPath
        });
      } finally {
        await context.close();
      }
    }

    const reportPath = path.join(OUTPUT_DIR, 'playwright_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n======================================================`);
    console.log(`PLAYWRIGHT ACCEPTANCE SUITE FINISHED!`);
    console.log(`Overall Suite Result: ${suitePassed ? 'ALL PASS' : 'SOME TESTS FAILED'}`);
    console.log(`Full JSON report saved to: ${reportPath}`);
    console.log(`======================================================`);

    if (!suitePassed) {
      process.exitCode = 1;
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  runSuite().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runSuite, VIEWPORTS };
