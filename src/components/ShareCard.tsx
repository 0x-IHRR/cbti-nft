"use client";

import { useRef, useState } from "react";
import type { Archetype, DimensionScores, Dimension } from "@/lib/types";

interface ShareCardProps {
  archetype: Archetype;
  scores: DimensionScores;
}

const DIMENSION_LABELS: Record<Dimension, string> = {
  CV: "信仰",
  TM: "择时",
  IM: "冲动",
  CP: "Copium",
  CU: "好奇",
};

const DIMENSION_COLORS_HEX: Record<Dimension, string> = {
  CV: "#a855f7",
  TM: "#3b82f6",
  IM: "#ec4899",
  CP: "#eab308",
  CU: "#22c55e",
};

const DIMENSION_COLORS: Record<Dimension, string> = {
  CV: "bg-purple-500",
  TM: "bg-blue-500",
  IM: "bg-pink-500",
  CP: "bg-yellow-500",
  CU: "bg-green-500",
};

/**
 * Generate share data for property testing.
 */
export function generateShareData(
  archetype: Archetype,
  scores: DimensionScores
): {
  cardData: {
    name: string;
    cnName: string;
    oneLiner: string;
    dimensions: Record<Dimension, number>;
  };
  shareText: string;
} {
  return {
    cardData: {
      name: archetype.name,
      cnName: archetype.cnName,
      oneLiner: archetype.oneLiner,
      dimensions: { ...scores },
    },
    shareText: `我的CBTI结果是：${archetype.name}（${archetype.cnName}）— ${archetype.oneLiner}`,
  };
}

/**
 * Draw the share card onto a Canvas and return as Blob.
 */
function drawCardToCanvas(
  archetype: Archetype,
  scores: DimensionScores
): HTMLCanvasElement {
  const W = 600;
  const H = 520;
  const canvas = document.createElement("canvas");
  canvas.width = W * 2; // 2x for retina
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // Border
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.stroke();

  // Title
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CBTI 加密持仓者类型指数", W / 2, 40);

  // Archetype name (gradient)
  ctx.font = "bold 28px sans-serif";
  const gradient = ctx.createLinearGradient(150, 0, 450, 0);
  gradient.addColorStop(0, "#c084fc");
  gradient.addColorStop(0.5, "#ec4899");
  gradient.addColorStop(1, "#facc15");
  ctx.fillStyle = gradient;
  ctx.fillText(archetype.name, W / 2, 80);

  // Chinese name
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(archetype.cnName, W / 2, 115);

  // One-liner
  ctx.fillStyle = "#9ca3af";
  ctx.font = "italic 14px sans-serif";
  const liner = `"${archetype.oneLiner}"`;
  // Wrap text if too long
  const maxWidth = W - 80;
  if (ctx.measureText(liner).width > maxWidth) {
    const mid = Math.floor(liner.length / 2);
    const breakAt = liner.lastIndexOf("，", mid) + 1 || mid;
    ctx.fillText(liner.slice(0, breakAt), W / 2, 155);
    ctx.fillText(liner.slice(breakAt), W / 2, 175);
  } else {
    ctx.fillText(liner, W / 2, 165);
  }

  // Dimension bars
  const dims: Dimension[] = ["CV", "TM", "IM", "CP", "CU"];
  const maxScore = Math.max(...Object.values(scores), 1);
  const barStartY = 210;
  const barH = 12;
  const barGap = 44;
  const barLeft = 100;
  const barRight = W - 60;
  const barWidth = barRight - barLeft;

  dims.forEach((dim, i) => {
    const y = barStartY + i * barGap;

    // Label
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(DIMENSION_LABELS[dim], 40, y + barH - 1);

    // Background bar
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.roundRect(barLeft, y, barWidth, barH, 6);
    ctx.fill();

    // Filled bar
    const fillW = (scores[dim] / maxScore) * barWidth;
    if (fillW > 0) {
      ctx.fillStyle = DIMENSION_COLORS_HEX[dim];
      ctx.beginPath();
      ctx.roundRect(barLeft, y, Math.max(fillW, 8), barH, 6);
      ctx.fill();
    }

    // Score number
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px monospace";
    ctx.textAlign = "right";
    ctx.fillText(String(scores[dim]), W - 30, y + barH - 1);
  });

  // Footer
  ctx.fillStyle = "#4b5563";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("cbti.app — 你是哪种 Crypto Degen？", W / 2, H - 20);

  return canvas;
}

export default function ShareCard({ archetype, scores }: ShareCardProps) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const maxScore = Math.max(...Object.values(scores), 1);
  const { shareText } = generateShareData(archetype, scores);

  const lockRef = useRef(false);

  const handleSaveImage = async () => {
    if (saving || lockRef.current) return;
    lockRef.current = true;
    setSaving(true);
    try {
      const canvas = drawCardToCanvas(archetype, scores);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("生成图片失败");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CBTI-${archetype.name}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setSaving(false);
      lockRef.current = false;
    }
  };

  const handleShareToX = () => {
    // Build OG image URL for Twitter Card preview
    const ogParams = new URLSearchParams({
      name: archetype.name,
      cnName: archetype.cnName,
      oneLiner: archetype.oneLiner,
      cv: String(scores.CV),
      tm: String(scores.TM),
      im: String(scores.IM),
      cp: String(scores.CP),
      cu: String(scores.CU),
    });
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://cbti.app";
    const shareUrl = `${siteUrl}/share?${ogParams.toString()}`;
    const text = encodeURIComponent(
      `${shareText}\n\n🧠 测测你是哪种 Crypto Degen 👉`
    );
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleShareToInstagram = async () => {
    // Instagram 不支持网页直接分享文字/图片，先下载图片，提示用户手动发
    await handleSaveImage();
    // 打开 Instagram
    window.open("https://www.instagram.com/", "_blank");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(
        `${shareText}\n\n🧠 测测你是哪种 Crypto Degen 👉 https://cbti.app`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Visual preview card */}
      <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 text-center">
          <p className="text-xs font-medium tracking-widest text-gray-500 uppercase">
            CBTI 加密持仓者类型指数
          </p>
          <h2 className="mt-2 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-2xl font-extrabold text-transparent">
            {archetype.name}
          </h2>
          <p className="mt-1 text-lg font-bold text-gray-200">
            {archetype.cnName}
          </p>
        </div>
        <p className="mb-4 text-center text-sm italic text-gray-400">
          &ldquo;{archetype.oneLiner}&rdquo;
        </p>
        <div className="flex flex-col gap-2">
          {(Object.keys(DIMENSION_LABELS) as Dimension[]).map((dim) => (
            <div key={dim} className="flex items-center gap-2">
              <span className="w-14 text-xs text-gray-500">
                {DIMENSION_LABELS[dim]}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div
                  data-testid={`share-bar-${dim}`}
                  className={`h-full rounded-full ${DIMENSION_COLORS[dim]}`}
                  style={{ width: `${(scores[dim] / maxScore) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-mono text-gray-500">
                {scores[dim]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleShareToX}
          className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white border border-gray-600 transition hover:bg-gray-900 hover:scale-105"
        >
          𝕏 分享到 X
        </button>
        <button
          onClick={handleShareToInstagram}
          className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-4 py-3 text-sm font-bold text-white transition hover:scale-105"
        >
          📷 分享到 Ins
        </button>
      </div>
    </div>
  );
}
