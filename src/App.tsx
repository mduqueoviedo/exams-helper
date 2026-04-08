import { useEffect, useState } from "react";
import type { PreparedExam, PreparedQuestion, Exam } from "./types";
import { prepareExam } from "./utils";

type AnswerStatus = "idle" | "correct" | "incorrect";

type ExamId = "rsce-sociability" | string; // extendable for more exams in the future

const EXAMS: { id: ExamId; label: string; jsonPath: string }[] = [
  {
    id: "rsce-sociability",
    label: "Prueba de Sociabilidad - RSCE",
    jsonPath: "/data/rsce-sociability.json",
  }, // Add more exams here as needed
];

function App() {
  const [selectedExamId, setSelectedExamId] =
    useState<ExamId>("rsce-sociability");
  const [exam, setExam] = useState<PreparedExam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [status, setStatus] = useState<AnswerStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true);

        const examConfig = EXAMS.find((e) => e.id === selectedExamId);
        if (!examConfig) {
          throw new Error(`Exam config not found for id: ${selectedExamId}`);
        }

        const response = await fetch(examConfig.jsonPath);
        if (!response.ok) {
          throw new Error(`Failed to load exam JSON: ${response.status}`);
        }

        const data = (await response.json()) as Exam;
        const prepared = prepareExam(data);

        setExam(prepared);
        setCurrentIndex(0);
        setSelectedOptionId(null);
        setStatus("idle");
        setLoadingError(null);
        setCorrectCount(0);
        setIncorrectCount(0);
        setAnsweredCount(0);
      } catch (error: any) {
        console.error(error);
        setLoadingError(
          error?.message ?? "Unknown error while loading the exam JSON.",
        );
        setExam(null);
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [selectedExamId]);

  const handleChangeExam = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newExamId = event.target.value as ExamId;
    setSelectedExamId(newExamId);
  };

  const handleNextQuestion = () => {
    if (!exam) return;

    setSelectedOptionId(null);
    setStatus("idle");

    setCurrentIndex((prev) =>
      prev + 1 < exam.questions.length ? prev + 1 : 0,
    );
  };

  const handleSelectOption = (question: PreparedQuestion, optionId: string) => {
    if (question.disabled) return;

    // If already answered (correct or incorrect), ignore clicks
    if (status !== "idle") {
      return;
    }

    setSelectedOptionId(optionId);

    const selectedOption = question.preparedOptions.find(
      (option) => option.id === optionId,
    );
    if (!selectedOption) return;

    setAnsweredCount((prev) => prev + 1);

    if (selectedOption.correct) {
      setStatus("correct");
      setCorrectCount((prev) => prev + 1);
    } else {
      setStatus("incorrect");
      setIncorrectCount((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-700">Cargando examen...</div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="max-w-md bg-white shadow p-6 rounded border border-red-300 text-red-700">
          <h1 className="text-xl font-bold mb-2">Error</h1>
          <p>{loadingError}</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return null;
  }

  const question = exam.questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
        <header className="mb-4 border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {exam.title}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Pregunta {currentIndex + 1} de {exam.questions.length}
              </p>
            </div>

            <div className="flex flex-col items-start gap-1">
              <label className="text-xs font-semibold text-slate-600">
                Seleccionar examen
              </label>
              <select
                value={selectedExamId}
                onChange={handleChangeExam}
                className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
              >
                {EXAMS.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats panel */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
              <p className="text-slate-500">Respondidas</p>
              <p className="font-semibold text-slate-900">{answeredCount}</p>
            </div>
            <div className="rounded border border-green-200 bg-green-50 px-2 py-1.5">
              <p className="text-green-600">Correctas</p>
              <p className="font-semibold text-green-800">{correctCount}</p>
            </div>
            <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5">
              <p className="text-red-600">Incorrectas</p>
              <p className="font-semibold text-red-800">{incorrectCount}</p>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
              <p className="text-slate-500">Aciertos</p>
              <p className="font-semibold text-slate-900">
                {answeredCount === 0
                  ? "-"
                  : `${Math.round((correctCount / answeredCount) * 100)}%`}
              </p>
            </div>
          </div>

          {exam.totalErrors > 0 && (
            <div className="mt-3 rounded border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
              Hay {exam.totalErrors} pregunta(s) con errores de configuración.
              Por favor, revisa el archivo JSON.
            </div>
          )}
        </header>

        <main>
          <div className="mb-4">
            <p className="text-lg font-medium text-slate-900 mb-2">
              {question.text}
            </p>

            {question.errors.length > 0 && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">
                <p className="font-semibold mb-1">
                  Esta pregunta está mal configurada:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {question.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                <p className="mt-2">
                  No se puede responder hasta que se corrija en el archivo JSON.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {question.preparedOptions.map((option) => {
                const isSelected = selectedOptionId === option.id;

                let borderColor = "border-slate-300";
                let backgroundColor = "bg-white";
                let textColor = "text-slate-900";

                if (status !== "idle" && isSelected) {
                  if (option.correct) {
                    borderColor = "border-green-500";
                    backgroundColor = "bg-green-50";
                    textColor = "text-green-800";
                  } else {
                    borderColor = "border-red-500";
                    backgroundColor = "bg-red-50";
                    textColor = "text-red-800";
                  }
                } else if (status !== "idle" && option.correct) {
                  borderColor = "border-green-400";
                }

                const disabledClasses = question.disabled
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer hover:bg-slate-50";

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={question.disabled}
                    onClick={() => handleSelectOption(question, option.id)}
                    className={`w-full text-left px-3 py-2 rounded border ${borderColor} ${backgroundColor} ${textColor} ${disabledClasses}`}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>

            {!question.disabled && (
              <div className="mt-3 min-h-[1.5rem]">
                {status === "correct" && (
                  <p className="text-green-700 text-sm font-medium">
                    ¡Correcto!
                  </p>
                )}
                {status === "incorrect" && (
                  <p className="text-red-700 text-sm font-medium">
                    Respuesta incorrecta. La opción correcta está resaltada en
                    verde.
                  </p>
                )}
              </div>
            )}

            {question.explanation && status !== "idle" && (
              <div className="mt-3 rounded bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800">
                <span className="font-semibold">Explicación: </span>
                {question.explanation}
              </div>
            )}
          </div>
        </main>

        <footer className="mt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={handleNextQuestion}
            className="px-4 py-2 rounded bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
          >
            Siguiente
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-xs hover:bg-slate-50"
          >
            Reiniciar examen
          </button>
        </footer>

        <p className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
          Proyecto personal sin carácter oficial. La información puede contener
          errores; contrástala siempre con fuentes oficiales. El autor no asume
          ninguna responsabilidad por su uso.
        </p>
      </div>
    </div>
  );
}

export default App;
