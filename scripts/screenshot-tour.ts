/**
 * Visual tour — full-page screenshots of every module against a running
 * server (demo mode). Used for design review and README assets.
 *
 *   PLAYWRIGHT_BROWSERS_PATH=… npx tsx scripts/screenshot-tour.ts [baseUrl] [outDir]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "/tmp/lexos-shots";

async function main() {
  const browser = await chromium.launch({
    // Use the environment's bundled Chromium regardless of Playwright build pinning.
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.6,
  });

  const shot = async (name: string, opts: { fullPage?: boolean } = {}) => {
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.fullPage ?? false });
    console.log(`✓ ${name}`);
  };

  // 1 — Dashboard
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await shot("01-dashboard", { fullPage: true });

  // 2 — Cases
  await page.goto(`${BASE}/cases`, { waitUntil: "networkidle" });
  await shot("02-cases");

  // 3 — Case workspace (overview)
  await page.goto(`${BASE}/cases/case-1`, { waitUntil: "networkidle" });
  await shot("03-case-overview", { fullPage: true });

  // 4 — Case AI tab with persisted structured analysis
  await page.goto(`${BASE}/cases/case-1?tab=ai`, { waitUntil: "networkidle" });
  await shot("04-case-ai-analysis", { fullPage: true });

  // 5 — Jalali calendar
  await page.goto(`${BASE}/calendar`, { waitUntil: "networkidle" });
  await shot("05-calendar");

  // 6 — Deadline dialog with live rule computation
  await page.goto(`${BASE}/calendar?new=deadline`, { waitUntil: "networkidle" });
  await page.waitForSelector('input[name="trigger_date"]', { timeout: 8000 });
  await page.fill('input[name="trigger_date"]', "1405/03/22");
  await page.waitForTimeout(1600); // compute preview round-trip
  await shot("06-deadline-engine");

  // 7 — AI workspace with a streamed exchange (SSE holds the connection,
  // so networkidle never fires — wait on DOM + fixed stream budget instead)
  await page.goto(
    `${BASE}/ai?agent=research_agent&q=${encodeURIComponent("فرق خلع ید و تصرف عدوانی چیست؟")}`,
    { waitUntil: "domcontentloaded" },
  );
  await page.waitForTimeout(12_000); // let the demo stream finish
  await shot("07-ai-workspace");

  // 8 — Documents
  await page.goto(`${BASE}/documents`, { waitUntil: "networkidle" });
  await shot("08-documents");

  // 9 — Draft editor (واخواهی draft)
  await page.goto(`${BASE}/drafts/dr-1`, { waitUntil: "networkidle" });
  await shot("09-draft-editor", { fullPage: true });

  // 10 — Knowledge vault
  await page.goto(`${BASE}/knowledge`, { waitUntil: "networkidle" });
  await shot("10-knowledge-vault", { fullPage: true });

  // 11 — Contacts CRM
  await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
  await shot("11-contacts");

  // 12 — Login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await shot("12-login");

  await browser.close();
  console.log(`done → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
