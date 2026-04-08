import { describe, it, expect } from "vitest";
import { shuffleArray, validateQuestion, prepareExam } from "./utils";
import type { Question, Exam } from "./types";

// --- helpers ---

function makeOption(id: string, correct: boolean) {
  return { id, text: `Option ${id}`, correct };
}

function makeValidQuestion(id = "q1"): Question {
  return {
    id,
    text: "Test question",
    options: [
      makeOption("a", true),
      makeOption("b", false),
      makeOption("c", false),
      makeOption("d", false),
    ],
  };
}

function makeExam(questions: Question[]): Exam {
  return { id: "exam1", title: "Test Exam", questions };
}

// --- shuffleArray ---

describe("shuffleArray", () => {
  it("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(arr.length);
  });

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr).sort()).toEqual([...arr].sort());
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  it("returns a new array instance", () => {
    const arr = [1, 2, 3];
    expect(shuffleArray(arr)).not.toBe(arr);
  });
});

// --- validateQuestion ---

describe("validateQuestion", () => {
  it("returns no errors for a valid question", () => {
    expect(validateQuestion(makeValidQuestion())).toHaveLength(0);
  });

  it("returns an error when there are no correct options", () => {
    const question: Question = {
      ...makeValidQuestion(),
      options: [
        makeOption("a", false),
        makeOption("b", false),
        makeOption("c", false),
        makeOption("d", false),
      ],
    };
    expect(validateQuestion(question)).toContain(
      "No options are marked as correct.",
    );
  });

  it("returns an error when more than one option is correct", () => {
    const question: Question = {
      ...makeValidQuestion(),
      options: [
        makeOption("a", true),
        makeOption("b", true),
        makeOption("c", false),
        makeOption("d", false),
      ],
    };
    const errors = validateQuestion(question);
    expect(errors.some((e) => e.includes("More than one"))).toBe(true);
  });

  it("returns an error when there are fewer than 3 incorrect options", () => {
    const question: Question = {
      ...makeValidQuestion(),
      options: [makeOption("a", true), makeOption("b", false)],
    };
    const errors = validateQuestion(question);
    expect(errors.some((e) => e.includes("incorrect option"))).toBe(true);
  });
});

// --- prepareExam ---

describe("prepareExam", () => {
  it("returns the same number of questions", () => {
    const exam = makeExam([makeValidQuestion("q1"), makeValidQuestion("q2")]);
    expect(prepareExam(exam).questions).toHaveLength(2);
  });

  it("each valid question has exactly 4 prepared options", () => {
    const prepared = prepareExam(makeExam([makeValidQuestion()]));
    expect(prepared.questions[0].preparedOptions).toHaveLength(4);
  });

  it("the correct option is always included in preparedOptions", () => {
    const prepared = prepareExam(makeExam([makeValidQuestion()]));
    expect(prepared.questions[0].preparedOptions.some((o) => o.correct)).toBe(
      true,
    );
  });

  it("valid questions are not disabled", () => {
    const prepared = prepareExam(makeExam([makeValidQuestion()]));
    expect(prepared.questions[0].disabled).toBe(false);
  });

  it("invalid questions are disabled", () => {
    const question: Question = {
      ...makeValidQuestion(),
      options: [makeOption("a", false), makeOption("b", false)],
    };
    const prepared = prepareExam(makeExam([question]));
    expect(prepared.questions[0].disabled).toBe(true);
  });

  it("totalErrors reflects the number of invalid questions", () => {
    const valid = makeValidQuestion("q1");
    const invalid: Question = {
      ...makeValidQuestion("q2"),
      options: [makeOption("a", false)],
    };
    const prepared = prepareExam(makeExam([valid, invalid]));
    expect(prepared.totalErrors).toBe(1);
  });

  it("totalErrors is 0 when all questions are valid", () => {
    const exam = makeExam([makeValidQuestion("q1"), makeValidQuestion("q2")]);
    expect(prepareExam(exam).totalErrors).toBe(0);
  });
});
