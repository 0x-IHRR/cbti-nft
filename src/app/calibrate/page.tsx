"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCBTIStore } from "@/store/cbtiStore";
import WalletConnectModal from "@/components/WalletConnectModal";

export default function WalletCalibrationPage() {
  const router = useRouter();
  const { scores, archetype, setWallet, setCalibratedScores, setArchetype } =
    useCBTIStore();

  const [showModal, setShowModal] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalibrate = async (address: string) => {
    // If no scores from quiz, can't calibrate — go back to start
    if (!scores) {
      setError("未找到答题数据，请重新开始测试");
      return;
    }

    setCalibrating(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet/calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, scores }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `校准请求失败 (${res.status})`);
      }

      const data = await res.json();
      setCalibratedScores(data.calibratedScores);
      setArchetype(data.archetype);
      router.push("/result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "校准失败";
      setError(msg);
      setCalibrating(false);
    }
  };

  const handleWalletConnected = (address: string) => {
    setShowModal(false);
    // Store the wallet address first, then calibrate
    setWallet(address);
    handleCalibrate(address);
  };

  // If no scores and no archetype, user hasn't taken the quiz
  if (!scores && !archetype) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-gray-400">还没有答题数据</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-bold"
          >
            🚀 去答题
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold">🔮 钱包校准</h1>
        <p className="text-gray-400">
          连接钱包查看你的加密人格诊断结果，链上行为将校准你的维度分数
        </p>
        <p className="text-xs text-yellow-500/80">
          ⚠️ 必须连接钱包才能查看结果
        </p>

        {error && (
          <div className="w-full rounded-lg bg-red-900/50 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {calibrating ? (
          <p className="text-purple-400">⏳ 正在校准链上行为...</p>
        ) : (
          <div className="flex w-full flex-col gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-bold shadow-lg shadow-purple-500/30 transition hover:scale-105 hover:shadow-purple-500/50"
            >
              🔗 连接钱包查看结果
            </button>
          </div>
        )}
      </div>

      <WalletConnectModal
        isOpen={showModal}
        onClose={handleWalletConnected}
        onSkip={() => setShowModal(false)}
      />
    </main>
  );
}
