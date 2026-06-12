-- Iranmanesh Legal OS — seed (Phase 6)
--
-- Global national courts (owner_id NULL ⇒ visible to every user, read-only).
-- deadline_rules / draft_templates / legal_articles are synced from the
-- TypeScript sources of truth by `npm run seed:reference` (service role),
-- which also computes embeddings when OPENAI_API_KEY is set:
--   src/lib/domain/deadlines.ts      → deadline_rules
--   src/lib/domain/templates.ts      → draft_templates
--   src/lib/domain/legal-corpus.ts   → legal_articles
--
-- Rich per-user demo data lives in src/lib/demo/data.ts (powers demo mode and
-- can be loaded into a real account from the app once signed in).

insert into public.courts (owner_id, name, kind, province, city) values
  (null, 'دادگاه عمومی حقوقی تهران — مجتمع قضایی شهید بهشتی', 'civil', 'تهران', 'تهران'),
  (null, 'دادگاه عمومی حقوقی تهران — مجتمع قضایی شهید مدنی', 'civil', 'تهران', 'تهران'),
  (null, 'دادگاه عمومی حقوقی تهران — مجتمع قضایی عدالت', 'civil', 'تهران', 'تهران'),
  (null, 'دادگاه تجدیدنظر استان تهران', 'appeal', 'تهران', 'تهران'),
  (null, 'دادسرای عمومی و انقلاب تهران — ناحیه ۱', 'prosecutor', 'تهران', 'تهران'),
  (null, 'دادسرای عمومی و انقلاب تهران — ناحیه ۶', 'prosecutor', 'تهران', 'تهران'),
  (null, 'دادگاه کیفری یک استان تهران', 'criminal_1', 'تهران', 'تهران'),
  (null, 'دادگاه کیفری دو تهران — مجتمع قضایی قدس', 'criminal_2', 'تهران', 'تهران'),
  (null, 'دادگاه خانواده تهران — مجتمع قضایی خانواده ۱ (ونک)', 'family', 'تهران', 'تهران'),
  (null, 'دادگاه خانواده تهران — مجتمع قضایی خانواده ۲ (ولنجک)', 'family', 'تهران', 'تهران'),
  (null, 'دادگاه انقلاب اسلامی تهران', 'revolutionary', 'تهران', 'تهران'),
  (null, 'دیوان عالی کشور', 'supreme', 'تهران', 'تهران'),
  (null, 'دیوان عدالت اداری', 'admin_justice', 'تهران', 'تهران'),
  (null, 'شورای حل اختلاف تهران', 'dispute_council', 'تهران', 'تهران'),
  (null, 'اجرای احکام مدنی تهران', 'enforcement', 'تهران', 'تهران'),
  (null, 'دادگاه عمومی حقوقی کرج', 'civil', 'البرز', 'کرج'),
  (null, 'دادگاه تجدیدنظر استان البرز', 'appeal', 'البرز', 'کرج'),
  (null, 'دادگاه عمومی حقوقی مشهد', 'civil', 'خراسان رضوی', 'مشهد'),
  (null, 'دادگاه عمومی حقوقی اصفهان', 'civil', 'اصفهان', 'اصفهان'),
  (null, 'دادگاه عمومی حقوقی شیراز', 'civil', 'فارس', 'شیراز'),
  (null, 'دادگاه عمومی حقوقی تبریز', 'civil', 'آذربایجان شرقی', 'تبریز'),
  (null, 'دادگاه عمومی حقوقی کرمان', 'civil', 'کرمان', 'کرمان')
on conflict do nothing;
