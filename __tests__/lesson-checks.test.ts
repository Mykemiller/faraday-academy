// FDY-189: flip-card checks on the academy-public read path. Imports the edge
// function's pure modules directly; they carry no Deno-only imports.
import { describe, expect, it } from "vitest";
import {
  type CheckRow,
  type CourseBundle,
  validateCheck,
} from "../supabase/functions/academy-public/validate.ts";
import { buildCourse } from "../supabase/functions/academy-public/shape.ts";

const ABCD = { A: "a", B: "b", C: "c", D: "d" };

function check(over: Partial<CheckRow> = {}): CheckRow {
  return {
    lesson_id: "lesson-1",
    card_index: 1,
    question: "Which date matters most?",
    options: { ...ABCD },
    correct_key: "B",
    rationales: { A: "ra", B: "rb", C: "rc", D: "rd" },
    wrong_choice_note: "A tempts because price feels like the headline.",
    status: "published",
    ...over,
  };
}

function bundle(checks: CheckRow[]): CourseBundle {
  return {
    course: {
      id: "course-1", course_code: "FA-T-101", title: "Course", level: "101", voice: "Gil",
      status: "published", public_slug: "course", primary_domain_id: null, welcome_message: null,
      audience_personas: null, updated_at: null,
    },
    modules: [{ id: "m1", course_id: "course-1", position: 1, title: "M1", faradays_take: null,
      knowledge_check_question: null, knowledge_check_answer: null }],
    lessons: [
      { id: "lesson-1", module_id: "m1", position: 1, title: "L1", body: "Body.", word_count: 1 },
      { id: "lesson-2", module_id: "m1", position: 2, title: "L2", body: "Body.", word_count: 1 },
    ],
    quiz: [],
    glossary: [],
    checks,
  };
}

const RULES = { price_101_usd: null, price_advanced_usd: null };

describe("validateCheck", () => {
  it("accepts a well-formed approved or published check", () => {
    expect(validateCheck(check())).toEqual([]);
    expect(validateCheck(check({ status: "approved" }))).toEqual([]);
  });

  it("rejects drafts even if one slips past the query filter", () => {
    expect(validateCheck(check({ status: "draft" }))).toContain("status draft");
  });

  it("rejects options or rationales that are not exactly A-D", () => {
    expect(validateCheck(check({ options: { A: "a", B: "b", C: "c" } }))).toContain("options are not exactly A-D");
    expect(validateCheck(check({ options: { ...ABCD, E: "e" } }))).toContain("options are not exactly A-D");
    expect(validateCheck(check({ rationales: { ...ABCD, D: " " } }))).toContain("rationales are not exactly A-D");
  });

  it("rejects a correct_key outside A-D", () => {
    expect(validateCheck(check({ correct_key: "E" }))).toContain("correct_key is not A-D");
  });

  it("keeps internal taxonomy codes away from learners", () => {
    expect(validateCheck(check({ question: "What does D2 cover?" }))).toContain('taxonomy code "D2"');
  });
});

describe("buildCourse checks", () => {
  it("nests checks under their lesson in card order, without excerpt or status", () => {
    const out = buildCourse(
      bundle([check({ card_index: 2, question: "Second?" }), check({ card_index: 1 })]),
      null, new Map(), { free: true }, RULES,
    ) as { modules: Array<{ lessons: Array<{ id: string; checks: Array<Record<string, unknown>> }> }> };
    const [l1, l2] = out.modules[0].lessons;
    expect(l1.checks.map((c) => c.card_index)).toEqual([1, 2]);
    expect(Object.keys(l1.checks[0]).sort()).toEqual(
      ["card_index", "correct_key", "options", "question", "rationales", "wrong_choice_note"],
    );
    expect(l2.checks).toEqual([]);
  });

  it("serves an empty list when a course has no checks", () => {
    const out = buildCourse(bundle([]), null, new Map(), { free: true }, RULES) as {
      modules: Array<{ lessons: Array<{ checks: unknown[] }> }>;
    };
    expect(out.modules[0].lessons.every((l) => Array.isArray(l.checks) && l.checks.length === 0)).toBe(true);
  });
});
