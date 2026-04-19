import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/questions/start/route";
import { POST as submitPost } from "@/app/api/questions/submit/route";
import { POST as calibratePost } from "@/app/api/wallet/calibrate/route";

describe("GET /api/questions/start", () => {
  it("returns sessionId and 8 questions", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBeDefined();
    expect(typeof data.sessionId).toBe("string");
    expect(data.questions).toHaveLength(8);
  });

  it("returns questions without strongMatch or secondaryMatch", async () => {
    const response = await GET();
    const data = await response.json();

    for (const question of data.questions) {
      expect(question).toHaveProperty("id");
      expect(question).toHaveProperty("text");
      expect(question).toHaveProperty("group");
      expect(question).toHaveProperty("options");
      expect(question).not.toHaveProperty("strongMatch");
      expect(question).not.toHaveProperty("secondaryMatch");
    }
  });
});

describe("POST /api/questions/submit", () => {
  it("returns scores and archetype with valid answers", async () => {
    // First get questions to build valid answers
    const startResponse = await GET();
    const startData = await startResponse.json();
    const questions = startData.questions;

    // Build valid answers — pick first option for each question
    const answers = questions.map((q: { id: string; options: { id: string }[] }) => ({
      questionId: q.id,
      optionId: q.options[0].id,
    }));

    const request = new Request("http://localhost/api/questions/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    const response = await submitPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.scores).toBeDefined();
    expect(data.scores).toHaveProperty("CV");
    expect(data.scores).toHaveProperty("TM");
    expect(data.scores).toHaveProperty("IM");
    expect(data.scores).toHaveProperty("CP");
    expect(data.scores).toHaveProperty("CU");
    expect(data.archetype).toBeDefined();
    expect(data.archetype).toHaveProperty("name");
    expect(data.archetype).toHaveProperty("cnName");
    expect(data.archetype).toHaveProperty("oneLiner");
    expect(data.archetype).toHaveProperty("diagnosis");
    expect(data.archetype).toHaveProperty("evidence");
    expect(data.archetype.evidence).toHaveLength(3);
  });

  it("returns 400 with invalid body (wrong answer count)", async () => {
    const request = new Request("http://localhost/api/questions/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: [{ questionId: "q01", optionId: "a" }],
      }),
    });

    const response = await submitPost(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 with invalid questionId", async () => {
    const answers = Array.from({ length: 8 }, (_, i) => ({
      questionId: `invalid_q${i}`,
      optionId: "a",
    }));

    const request = new Request("http://localhost/api/questions/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    const response = await submitPost(request);
    expect(response.status).toBe(400);
  });
});

describe("POST /api/wallet/calibrate", () => {
  it("returns calibrated scores and archetype", async () => {
    const request = new Request("http://localhost/api/wallet/calibrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        scores: { CV: 5, TM: 3, IM: 7, CP: 2, CU: 4 },
      }),
    });

    const response = await calibratePost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.calibratedScores).toBeDefined();
    expect(data.calibratedScores).toHaveProperty("CV");
    expect(data.calibratedScores).toHaveProperty("TM");
    expect(data.calibratedScores).toHaveProperty("IM");
    expect(data.calibratedScores).toHaveProperty("CP");
    expect(data.calibratedScores).toHaveProperty("CU");
    expect(data.archetype).toBeDefined();
    expect(data.archetype).toHaveProperty("name");
  });

  it("returns 400 with invalid wallet address", async () => {
    const request = new Request("http://localhost/api/wallet/calibrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: "invalid-address!!!",
        scores: { CV: 5, TM: 3, IM: 7, CP: 2, CU: 4 },
      }),
    });

    const response = await calibratePost(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 with empty wallet address", async () => {
    const request = new Request("http://localhost/api/wallet/calibrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: "",
        scores: { CV: 5, TM: 3, IM: 7, CP: 2, CU: 4 },
      }),
    });

    const response = await calibratePost(request);
    expect(response.status).toBe(400);
  });
});
