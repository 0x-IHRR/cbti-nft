import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { selectQuestions } from "@/lib/quizEngine";
import type { Question } from "@/lib/types";
import questionsData from "@/data/questions.json";

export async function GET() {
  try {
    const bank = questionsData as Question[];
    const selected = selectQuestions(bank);
    const sessionId = uuidv4();

    // Strip strongMatch and secondaryMatch from the response
    const questions = selected.map(({ strongMatch, secondaryMatch, ...rest }) => rest);

    return NextResponse.json({ sessionId, questions });
  } catch {
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}
