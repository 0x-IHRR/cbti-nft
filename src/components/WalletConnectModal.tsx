"use client";

import { useState, type ReactNode } from "react";
import { useWallet } from "@/components/WalletProvider";
import { useCBTIStore } from "@/store/cbtiStore";

// ── Wallet SVG Logos ──

function PhantomLogo() {
  return (
    <img src="/wallets/phantom.svg" alt="Phantom" width={28} height={28} className="rounded-md" />
  );
}

function MetaMaskLogo() {
  return (
    <img src="/wallets/metamask.svg" alt="MetaMask" width={28} height={28} />
  );
}

function BinanceLogo() {
  return (
    <img src="/wallets/binance.ico" alt="Binance Wallet" width={28} height={28} className="rounded-md" />
  );
}

// ── Wallet Config ──

interface WalletConfig {
  name: string;
  logo: ReactNode;
  installUrl: string;
}

const WALLETS: WalletConfig[] = [
  { name: "Phantom", logo: <PhantomLogo />, installUrl: "https://phantom.app/" },
  { name: "MetaMask", logo: <MetaMaskLogo />, installUrl: "https://metamask.io/" },
  { name: "Binance Wallet", logo: <BinanceLogo />, installUrl: "https://www.bnbchain.org/en/binance-wallet" },
];

// ── Component ──

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: (address: string) => void;
  onSkip: () => void;
}

export default function WalletConnectModal({
  isOpen,
  onClose,
  onSkip,
}: WalletConnectModalProps) {
  const { connect } = useWallet();
  const setWallet = useCBTIStore((s) => s.setWallet);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installUrl, setInstallUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = async (wallet: WalletConfig) => {
    setConnectingWallet(wallet.name);
    setError(null);
    setInstallUrl(null);
    try {
      const address = await connect(wallet.name);
      setWallet(address);
      onClose(address);
    } catch (err) {
      const message = err instanceof Error ? err.message : "钱包连接失败";
      setError(message);
      if (message.includes("未检测到")) {
        setInstallUrl(wallet.installUrl);
      }
    } finally {
      setConnectingWallet(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6">
        <h3 className="mb-4 text-center text-xl font-bold text-white">
          🔗 连接钱包
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/50 p-3 text-center text-sm text-red-300">
            <p>{error}</p>
            {installUrl && (
              <a
                href={installUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-purple-400 underline hover:text-purple-300"
              >
                前往安装 →
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleSelect(wallet)}
              disabled={connectingWallet !== null}
              className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800 px-5 py-4 text-white transition hover:border-purple-500 hover:bg-gray-750 disabled:opacity-50"
            >
              <span className="flex-shrink-0">{wallet.logo}</span>
              <span className="font-medium">{wallet.name}</span>
              {connectingWallet === wallet.name && (
                <span className="ml-auto text-sm text-gray-400">连接中...</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={onSkip}
            className="w-full rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
