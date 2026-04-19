"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCBTIStore } from "@/store/cbtiStore";
import fetchWithRetry from "@/lib/fetchWithRetry";

export default function QuizPage() {
  const router = useRouter();
  const {
    questions,
    currentIndex,
    answers,
    setQuestions,
    submitAnswer,
    nextQuestion,
    setScores,
    setArchetype,
  } = useCBTIStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry("/api/questions/start");
      if (!res.ok) throw new Error("Failed to load questions");
      const data = await res.json();
      setQuestions(data.questions);
    } catch {
      setError("题目加载失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (optionId: string) => {
    if (!questions[currentIndex]) return;

    const answer = {
      questionId: questions[currentIndex].id,
      optionId,
    };
    submitAnswer(answer);

    const newAnswerCount = answers.length + 1;

    if (newAnswerCount >= 8) {
      // All questions answered — submit
      setSubmitting(true);
      try {
        const allAnswers = [...answers, answer];
        const res = await fetchWithRetry("/api/questions/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: allAnswers }),
        });
        if (!res.ok) throw new Error("Submit failed");
        const data = await res.json();
        setScores(data.scores);
        setArchetype(data.archetype);
        router.push("/calibrate");
      } catch {
        setError("提交失败，请重试");
        setSubmitting(false);
      }
    } else {
      nextQuestion();
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-lg text-gray-400">⏳ 正在加载题目...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 text-white">
        <p className="text-lg text-red-400">{error}</p>
        <button
          onClick={fetchQuestions}
          className="rounded-lg bg-purple-600 px-6 py-3 font-bold text-white transition hover:bg-purple-500"
        >
          🔄 重试
        </button>
      </main>
    );
  }

  if (submitting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-lg text-gray-400">🔮 正在分析你的加密人格...</p>
      </main>
    );
  }

  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-purple-400">
            {currentIndex + 1} / 8
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${((currentIndex + 1) / 8) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="mb-6 text-center text-xl font-bold">{question.text}</h2>

        <div className="flex flex-col gap-3">
          {question.options.map((option: { id: string; text: string }) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="rounded-xl border border-gray-700 bg-gray-900 px-6 py-4 text-left text-gray-200 transition hover:border-purple-500 hover:bg-gray-800"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
