/**
 * Table-driven tests for the deadline engine (docs/10 §Deadlines).
 * The date-math path is safety-critical: a wrong due date = malpractice.
 *
 *   npm test  →  npx tsx scripts/test-deadlines.ts
 *
 * Computation contract (ق.آ.د.م):
 *   ماده ۴۴۵ — day of service & day of action excluded ⇒ due = trigger + days + 1
 *   ماده ۴۴۴ — holiday rolls forward (MVP: Friday → Saturday)
 *   ماده ۴۴۳ — procedural month = 30 days (rules are stored as day counts)
 */
import { computeDeadline, DEADLINE_RULES } from "../src/lib/domain/deadlines";
import { fromJalali, toJalali, isFriday } from "../src/lib/jalali";

let failures = 0;
function check(name: string, actual: string, expected: string) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗ FAIL"} ${name}: ${actual}${ok ? "" : ` (expected ${expected})`}`);
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function jalaliStr(d: Date): string {
  const j = toJalali(d);
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
}

// ── 1. Canonical worked example known to every Iranian litigator:
// ابلاغ ۱ فروردین + مهلت ۲۰ روز ⇒ آخرین روز اقدام ۲۲ فروردین (روز ابلاغ و روز اقدام محسوب نمی‌شود)
// 1405/01/01 service → appeal_civil(20) → 1405/01/22 …unless Friday rolls it.
{
  const trigger = fromJalali(1405, 1, 1);
  const c = computeDeadline("appeal_civil", trigger, false);
  const expected = fromJalali(1405, 1, 22);
  // Friday roll is part of the contract — apply it to the expectation too.
  let exp = expected;
  while (isFriday(exp)) exp = new Date(exp.getTime() + 86_400_000);
  check("appeal 20d from 1405/01/01", jalaliStr(c.dueDate), jalaliStr(exp));
  check("appeal days resolved", String(c.days), "20");
}

// ── 2. Abroad variant = 60 days (ماده ۳۳۶: دو ماه = ۶۰ روز per ماده ۴۴۳).
{
  const trigger = fromJalali(1405, 1, 1);
  const c = computeDeadline("appeal_civil", trigger, true);
  check("appeal abroad days", String(c.days), "60");
  const naive = new Date(trigger);
  naive.setDate(naive.getDate() + 61);
  let exp = naive;
  while (isFriday(exp)) exp = new Date(exp.getTime() + 86_400_000);
  check("appeal abroad due", iso(c.dueDate), iso(exp));
}

// ── 3. Friday rolling (ماده ۴۴۴): construct a trigger whose +days+1 lands on Friday.
{
  // Find a Gregorian date where trigger+8 (cure_defect: 7+1) is a Friday.
  let probe = new Date(2026, 0, 1);
  while (new Date(probe.getTime() + 8 * 86_400_000).getDay() !== 5) {
    probe = new Date(probe.getTime() + 86_400_000);
  }
  const c = computeDeadline("expert_objection", probe, false); // 7 days
  check("friday rolled", String(c.rolledForHoliday), "true");
  check("due not friday", String(isFriday(c.dueDate)), "false");
  check("rolled to saturday", String(c.dueDate.getDay()), "6");
}

// ── 4. Every rule computes and explanation carries its citation.
{
  const trigger = new Date(2026, 5, 1);
  for (const r of DEADLINE_RULES) {
    const c = computeDeadline(r.code, trigger, false);
    if (!c.explanationFa.includes(r.citation)) {
      failures++;
      console.log(`✗ FAIL citation missing in explanation for ${r.code}`);
    }
    if (c.dueDate.getTime() <= trigger.getTime()) {
      failures++;
      console.log(`✗ FAIL ${r.code}: due date not after trigger`);
    }
  }
  console.log(`✓ all ${DEADLINE_RULES.length} rules compute with citations`);
}

// ── 5. Jalali round-trip integrity (calendar layer the engine depends on).
{
  const samples: [number, number, number][] = [
    [1405, 1, 1], [1405, 3, 22], [1405, 12, 29], [1403, 12, 30] /* leap */, [1404, 6, 31],
  ];
  for (const [jy, jm, jd] of samples) {
    const g = fromJalali(jy, jm, jd);
    const back = toJalali(g);
    const ok = back.jy === jy && back.jm === jm && back.jd === jd;
    if (!ok) {
      failures++;
      console.log(`✗ FAIL jalali roundtrip ${jy}/${jm}/${jd} → ${back.jy}/${back.jm}/${back.jd}`);
    }
  }
  console.log("✓ jalali ⇄ gregorian roundtrip");
}

// ── 6. Unknown rule must throw (never silently compute).
{
  let threw = false;
  try {
    computeDeadline("nonexistent_rule", new Date(), false);
  } catch {
    threw = true;
  }
  check("unknown rule throws", String(threw), "true");
}

console.log(failures === 0 ? "\n✓ ALL DEADLINE ENGINE TESTS PASSED" : `\n✗ ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
