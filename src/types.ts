export type QuestionOption = {
  id: string;
  text: string;
  correct: boolean;
};

export type Question = {
  id: string;
  text: string;
  explanation?: string;
  options: QuestionOption[];
};

export type Exam = {
  id: string;
  title: string;
  questions: Question[];
};

export type PreparedQuestion = Question & {
  preparedOptions: QuestionOption[];
  errors: string[];
  disabled: boolean;
};

export type PreparedExam = Exam & {
  questions: PreparedQuestion[];
  totalErrors: number;
};
