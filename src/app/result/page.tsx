"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCBTIStore } from "@/store/cbtiStore";
import { generateShareData } from "@/components/ShareCard";
import NFTMintButton from "@/components/NFTMintButton";
import type { DimensionScores } from "@/lib/types";

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  CV: "信仰 CV",
  TM: "择时 TM",
  IM: "冲动 IM",
  CP: "Copium CP",
  CU: "好奇 CU",
};

const DIMENSION_COLORS: Record<keyof DimensionScores, string> = {
  CV: "bg-purple-500",
  TM: "bg-blue-500",
  IM: "bg-pink-500",
  CP: "bg-yellow-500",
  CU: "bg-green-500",
};

export default function ResultPage() {
  const router = useRouter();
  const { archetype, scores, walletAddress } = useCBTIStore();

  useEffect(() => {
    if (!archetype || !scores) {
      router.push("/");
    } else if (!walletAddress) {
      router.push("/calibrate");
    }
  }, [archetype, scores, walletAddress, router]);

  if (!archetype || !scores || !walletAddress) {
    return null;
  }

  const maxScore = Math.max(...Object.values(scores), 1);
  const { shareText } = generateShareData(archetype, scores);

  const handleShareToX = () => {
    const shareUrl = `${window.location.origin}/share?t=${encodeURIComponent(archetype.name)}`;
    const text = encodeURIComponent(
      `我的CBTI结果是：${archetype.name}（${archetype.cnName}）\n\n"${archetype.oneLiner}"\n\n🧠 测测你是哪种 Crypto Degen 👉`
    );
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleShareToIns = () => {
    // Copy share text to clipboard, then open Instagram
    navigator.clipboard.writeText(`${shareText}\n\n🧠 测测你是哪种 Crypto Degen 👉 https://cbti.app`).catch(() => {});
    window.open("https://www.instagram.com/", "_blank");
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-950 px-4 py-12 text-white">
      <div className="w-full max-w-lg">
        {/* Archetype Header */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
            {archetype.name}
          </h1>
          <p className="mt-2 text-2xl font-bold text-gray-200">
            {archetype.cnName}
          </p>
          <blockquote className="mt-4 border-l-4 border-purple-500 pl-4 text-left italic text-gray-400">
            &ldquo;{archetype.oneLiner}&rdquo;
          </blockquote>
        </div>

        {/* Diagnosis */}
        <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-3 text-lg font-bold text-purple-400">📋 诊断报告</h2>
          <p className="leading-relaxed text-gray-300">{archetype.diagnosis}</p>
        </div>

        {/* Evidence */}
        <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-3 text-lg font-bold text-pink-400">🔍 证据</h2>
          <ul className="flex flex-col gap-2">
            {archetype.evidence.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="mt-0.5 text-yellow-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dimension Bars */}
        <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-bold text-green-400">📊 维度分析</h2>
          <div className="flex flex-col gap-4">
            {(Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[]).map(
              (dim) => (
                <div key={dim}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-400">{DIMENSION_LABELS[dim]}</span>
                    <span className="font-mono text-gray-300">{scores[dim]}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
                    <div
                      data-testid={`bar-${dim}`}
                      className={`h-full rounded-full ${DIMENSION_COLORS[dim]} transition-all`}
                      style={{ width: `${(scores[dim] / maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Action Buttons — share + mint in one row */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <button
            onClick={handleShareToX}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 border border-gray-700 py-3.5 font-bold text-white transition hover:bg-gray-800 hover:border-gray-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X
          </button>
          <button
            onClick={handleShareToIns}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 py-3.5 font-bold text-white transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Ins
          </button>
          <NFTMintButton
            walletAddress={walletAddress}
            archetype={archetype.name}
            scores={scores}
          />
        </div>
      </div>
    </main>
  );
}
