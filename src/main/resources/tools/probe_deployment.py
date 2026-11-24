import urllib.request
import ssl

ctx = ssl.create_default_context()
BASE_URL = "https://gamified-learning-platform-sandy.vercel.app"

routes = [
    "/",
    "/app",
    "/app/home",
    "/app/auth",
    "/app/minigame",
    "/app/quiz",
    "/app/volcard",
    "/app/account",
    "/app/memory",
    "/app/speed-math",
    "/app/code-puzzle",
    "/ui/assets/css/base.css",
    "/ui/assets/js/minigame.js",
    "/ui/assets/vendor/phaser.min.js",
    "/ui/assets/imgs/logo.png",
    "/ui/assets/units/warrior/idle.png"
]

print(f"--- Probing Vercel Production: {BASE_URL} ---")
success = 0
failed = 0

for r in routes:
    url = f"{BASE_URL}{r}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            content = resp.read()
            ct = resp.headers.get('Content-Type')
            print(f"[{resp.status}] {r:<25} | {ct} ({len(content):,} bytes)")
            if resp.status == 200:
                success += 1
            else:
                failed += 1
    except Exception as e:
        print(f"[FAIL] {r:<25} | Error: {e}")
        failed += 1

print(f"\nSummary: {success}/{len(routes)} passed, {failed} failed.")
if failed > 0:
    exit(1)
