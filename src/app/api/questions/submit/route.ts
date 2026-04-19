import { NextResponse } from "next/server";
import { computeScores } from "@/lib/scoreEngine";
import { mapArchetype } from "@/lib/typeMapper";
import type { Question, Answer, Archetype } from "@/lib/types";
import questionsData from "@/data/questions.json";
import archetypesData from "@/data/archetypes.json";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { answers } = body as { answers: Answer[] };

    // Validate answers array
    if (!Array.isArray(answers) || answers.length !== 8) {
      return NextResponse.json(
        { error: "answers array must contain exactly 8 items" },
        { status: 400 }
      );
    }

    const bank = questionsData as Question[];

    // Validate each answer has valid questionId and optionId
    for (const answer of answers) {
      if (!answer.questionId || !answer.optionId) {
        return NextResponse.json(
          { error: "Each answer must have questionId and optionId" },
          { status: 400 }
        );
      }
      const question = bank.find((q) => q.id === answer.questionId);
      if (!question) {
        return NextResponse.json(
          { error: `Invalid questionId: ${answer.questionId}` },
          { status: 400 }
        );
      }
      const validOption = question.options.some((o) => o.id === answer.optionId);
      if (!validOption) {
        return NextResponse.json(
          { error: `Invalid optionId: ${answer.optionId} for question ${answer.questionId}` },
          { status: 400 }
        );
      }
    }

    // Compute scores using full question data (with strongMatch/secondaryMatch)
    const answeredQuestions = answers.map((a) =>
      bank.find((q) => q.id === a.questionId)!
    );
    const scores = computeScores(answeredQuestions, answers);

    // Map to archetype
    const archetypeName = mapArchetype(scores);
    const archetypeConfig = (archetypesData as Archetype[]).find(
      (a) => a.name === archetypeName
    );

    return NextResponse.json({
      scores,
      archetype: archetypeConfig,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
