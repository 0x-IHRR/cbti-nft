import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") || "Zen Holder";
  const cnName = searchParams.get("cnName") || "佛系持仓者";
  const oneLiner = searchParams.get("oneLiner") || "";
  const cv = searchParams.get("cv") || "0";
  const tm = searchParams.get("tm") || "0";
  const im = searchParams.get("im") || "0";
  const cp = searchParams.get("cp") || "0";
  const cu = searchParams.get("cu") || "0";

  const scores = [
    { label: "信仰", value: Number(cv), color: "#a855f7" },
    { label: "择时", value: Number(tm), color: "#3b82f6" },
    { label: "冲动", value: Number(im), color: "#ec4899" },
    { label: "Copium", value: Number(cp), color: "#eab308" },
    { label: "好奇", value: Number(cu), color: "#22c55e" },
  ];
  const maxScore = Math.max(...scores.map((s) => s.value), 1);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          fontFamily: "sans-serif",
          color: "white",
          padding: "40px 60px",
        }}
      >
        <div style={{ fontSize: "18px", color: "#6b7280", marginBottom: "8px", display: "flex" }}>
          CBTI 加密持仓者类型指数
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 800,
            background: "linear-gradient(90deg, #c084fc, #ec4899, #facc15)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: "4px",
            display: "flex",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: "36px", fontWeight: 700, color: "#e5e7eb", marginBottom: "16px", display: "flex" }}>
          {cnName}
        </div>
        <div style={{ fontSize: "20px", color: "#9ca3af", fontStyle: "italic", marginBottom: "40px", display: "flex", textAlign: "center", maxWidth: "900px" }}>
          &ldquo;{oneLiner}&rdquo;
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "700px" }}>
          {scores.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "80px", fontSize: "18px", color: "#9ca3af", display: "flex" }}>
                {s.label}
              </div>
              <div
                style={{
                  flex: 1,
                  height: "20px",
                  background: "#1f2937",
                  borderRadius: "10px",
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: `${(s.value / maxScore) * 100}%`,
                    height: "100%",
                    background: s.color,
                    borderRadius: "10px",
                    display: "flex",
                  }}
                />
              </div>
              <div style={{ width: "40px", fontSize: "18px", color: "#d1d5db", textAlign: "right", display: "flex", justifyContent: "flex-end" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "30px", fontSize: "16px", color: "#4b5563", display: "flex" }}>
          cbti.app — 你是哪种 Crypto Degen？
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
