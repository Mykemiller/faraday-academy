// Faraday Academy — shared servability validator.
//
// A course ships only if it is structurally whole and carries no internal
// taxonomy codes. Anything that fails here is excluded from the catalog and its
// course endpoint returns the same plain 404 an unknown slug returns, so a
// broken course is indistinguishable from one that does not exist.

export const SERVABLE_STATUSES = ["approved", "published"] as const;

// Expected shape: 4 modules, 2 lessons each, 10 quiz items, 8 glossary terms.
export const EXPECTED = { modules: 4, lessons: 8, quiz: 10, glossary: 8 } as const;

// Only Gil and Mach have a defined public byline. The academy_voice enum also
// permits Both and Myke; a course carrying either has no author to render, so it
// is held back rather than shipped under a wrong name. This is an addition
// beyond the spec's listed exclusion reasons, and it is inert today — 0 servable
// courses use Both or Myke.
export const BYLINE_VOICES: readonly string[] = ["Gil", "Mach"];

// Internal taxonomy codes must never reach a learner. Domain codes (D1, D12,
// D2.11) and tower codes (T001, T-001). Mirrors the Postgres \m..\M checks run
// in Phase 0 — JS \b is the equivalent word boundary here.
const DOMAIN_CODE = /\bD\d{1,2}(?:\.\d+)?\b/;
const TOWER_CODE = /\bT-?\d{3}\b/;

// House style, enforced wherever this function writes copy of its own. These
// are not servability criteria — a course is not held back for containing one —
// but a derived summary that hits one is dropped rather than published.
const BANNED_PHRASES: readonly string[] = [
  "empowering",
  "leveraging",
  "unlocking potential",
  "cutting-edge",
  "best-in-class",
  "revolutionary",
  "in today's fast-paced world",
  "great question!",
  "i hope that helps!",
  "we're excited to announce",
  "faraday's methodology",
  "our approach",
  "the faraday framework",
  "learnworlds",
];

export function findBannedPhrase(text: string | null | undefined): string | null {
  if (!text) return null;
  const haystack = text.toLowerCase().replace(/[‘’]/g, "'");
  for (const phrase of BANNED_PHRASES) {
    if (haystack.includes(phrase)) return phrase;
  }
  return null;
}

export function findCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const d = text.match(DOMAIN_CODE);
  if (d) return d[0];
  const t = text.match(TOWER_CODE);
  if (t) return t[0];
  return null;
}

export type CourseRow = {
  id: string;
  course_code: string;
  title: string;
  level: string;
  voice: string;
  status: string;
  public_slug: string | null;
  primary_domain_id: string | null;
  welcome_message: string | null;
  audience_personas: string[] | null;
  updated_at: string | null;
};

export type ModuleRow = {
  id: string;
  course_id: string;
  position: number;
  title: string | null;
  faradays_take: string | null;
  knowledge_check_question: string | null;
  knowledge_check_answer: string | null;
};

export type LessonRow = {
  id: string;
  module_id: string;
  position: number;
  title: string | null;
  body: string | null;
  word_count: number | null;
};

export type QuizRow = {
  id: string;
  course_id: string;
  position: number;
  question: string | null;
  options: unknown;
  correct_answer: string | null;
  explanation: string | null;
};

export type GlossaryRow = {
  id: string;
  course_id: string;
  term: string | null;
  definition: string | null;
};

export type CheckRow = {
  lesson_id: string;
  card_index: number;
  question: string | null;
  options: unknown;
  correct_key: string | null;
  rationales: unknown;
  wrong_choice_note: string | null;
  status: string;
};

export type CourseBundle = {
  course: CourseRow;
  modules: ModuleRow[];
  lessons: LessonRow[]; // across all modules of this course
  quiz: QuizRow[];
  glossary: GlossaryRow[];
  checks: CheckRow[]; // servable flip-card checks across this course's lessons
};

export type Exclusion = { code: string; slug: string | null; reasons: string[] };

export function optionsOf(row: QuizRow): string[] {
  return Array.isArray(row.options) ? row.options.map((o) => String(o)) : [];
}

/** Returns [] when the course is servable, else the reasons it is not. */
export function validateCourse(b: CourseBundle): string[] {
  const reasons: string[] = [];
  const { course, modules, lessons, quiz, glossary } = b;

  if (!course.public_slug || !course.public_slug.trim()) reasons.push("missing public_slug");

  if (!BYLINE_VOICES.includes(course.voice)) {
    reasons.push(`voice "${course.voice}" has no public byline`);
  }

  if (modules.length !== EXPECTED.modules) {
    reasons.push(`module count ${modules.length} (expected ${EXPECTED.modules})`);
  }
  if (lessons.length !== EXPECTED.lessons) {
    reasons.push(`lesson count ${lessons.length} (expected ${EXPECTED.lessons})`);
  }
  if (quiz.length !== EXPECTED.quiz) {
    reasons.push(`quiz count ${quiz.length} (expected ${EXPECTED.quiz})`);
  }
  if (glossary.length !== EXPECTED.glossary) {
    reasons.push(`glossary count ${glossary.length} (expected ${EXPECTED.glossary})`);
  }

  // Every quiz item's correct_answer must match exactly one option.
  for (const q of quiz) {
    const opts = optionsOf(q);
    const matches = opts.filter((o) => o === q.correct_answer).length;
    if (matches !== 1) {
      reasons.push(`quiz #${q.position}: correct_answer matches ${matches} options`);
    }
  }

  // Taxonomy codes anywhere a learner can read.
  const scan: Array<[string, string | null | undefined]> = [
    ["course title", course.title],
    ["welcome message", course.welcome_message],
  ];
  for (const m of modules) {
    scan.push([`module ${m.position} title`, m.title]);
    scan.push([`module ${m.position} take`, m.faradays_take]);
    scan.push([`module ${m.position} check question`, m.knowledge_check_question]);
    scan.push([`module ${m.position} check answer`, m.knowledge_check_answer]);
  }
  for (const l of lessons) {
    scan.push([`lesson ${l.id} title`, l.title]);
    scan.push([`lesson ${l.id} body`, l.body]);
  }
  for (const q of quiz) {
    scan.push([`quiz ${q.position} question`, q.question]);
    scan.push([`quiz ${q.position} explanation`, q.explanation]);
    for (const o of optionsOf(q)) scan.push([`quiz ${q.position} option`, o]);
  }
  for (const g of glossary) {
    scan.push([`glossary "${g.term}" term`, g.term]);
    scan.push([`glossary "${g.term}" definition`, g.definition]);
  }
  for (const [where, text] of scan) {
    const hit = findCode(text);
    if (hit) reasons.push(`taxonomy code "${hit}" in ${where}`);
  }

  return reasons;
}

const CHECK_KEYS = ["A", "B", "C", "D"] as const;

function isKeyedAtoD(v: unknown): v is Record<string, string> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const keys = Object.keys(v).sort();
  return keys.length === 4 && keys.every((k, i) => k === CHECK_KEYS[i]) &&
    Object.values(v).every((x) => typeof x === "string" && x.trim().length > 0);
}

/**
 * Returns [] when a flip-card check may be served, else the reasons it may not.
 * A failing check is dropped on its own; it never holds back the course. The
 * table enforces most of this already; this guards the wire shape and keeps
 * taxonomy codes away from learners, same as every other course text.
 */
export function validateCheck(c: CheckRow): string[] {
  const reasons: string[] = [];
  if (!(SERVABLE_STATUSES as readonly string[]).includes(c.status)) reasons.push(`status ${c.status}`);
  if (!c.question || !c.question.trim()) reasons.push("empty question");
  if (!isKeyedAtoD(c.options)) reasons.push("options are not exactly A-D");
  if (!isKeyedAtoD(c.rationales)) reasons.push("rationales are not exactly A-D");
  if (!c.correct_key || !(CHECK_KEYS as readonly string[]).includes(c.correct_key)) {
    reasons.push("correct_key is not A-D");
  }
  const texts = [c.question, c.wrong_choice_note,
    ...(isKeyedAtoD(c.options) ? Object.values(c.options) : []),
    ...(isKeyedAtoD(c.rationales) ? Object.values(c.rationales) : [])];
  for (const t of texts) {
    const hit = findCode(t);
    if (hit) reasons.push(`taxonomy code "${hit}"`);
  }
  return reasons;
}
