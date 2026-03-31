import type {
  Exam,
  Question,
  QuestionOption,
  PreparedExam,
  PreparedQuestion,
} from "./types";

export function shuffleArray<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function validateQuestion(question: Question): string[] {
  const errors: string[] = [];

  const correctOptions = question.options.filter((o) => o.correct);
  const incorrectOptions = question.options.filter((o) => !o.correct);

  if (correctOptions.length === 0) {
    errors.push("No options are marked as correct.");
  } else if (correctOptions.length > 1) {
    errors.push("More than one option is marked as correct.");
  }

  if (incorrectOptions.length < 3) {
    errors.push(
      `Only ${incorrectOptions.length} incorrect option(s); at least 3 are required.`,
    );
  }

  return errors;
}

export function prepareExam(exam: Exam): PreparedExam {
  const shuffledQuestions = shuffleArray(exam.questions);

  const preparedQuestions: PreparedQuestion[] = shuffledQuestions.map(
    (question) => {
      const errors = validateQuestion(question);

      const correctOptions = question.options.filter((o) => o.correct);
      const incorrectOptions = question.options.filter((o) => !o.correct);

      let preparedOptions: QuestionOption[] = [];
      let disabled = false;

      if (errors.length === 0) {
        // 1 correct + at least 3 incorrects -> pick 3 incorrects and shuffle
        const pickedIncorrect = shuffleArray(incorrectOptions).slice(0, 3);
        const optionsToShow = [correctOptions[0], ...pickedIncorrect];
        preparedOptions = shuffleArray(optionsToShow);
      } else {
        // show disabled question with original options
        disabled = true;
        preparedOptions = question.options;
      }

      return {
        ...question,
        preparedOptions,
        errors,
        disabled,
      };
    },
  );

  const totalErrors = preparedQuestions.filter(
    (question) => question.errors.length > 0,
  ).length;

  return {
    ...exam,
    questions: preparedQuestions,
    totalErrors,
  };
}
