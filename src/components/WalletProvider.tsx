"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface WalletContextState {
  connected: boolean;
  publicKey: string | null;
  walletName: string | null;
  connect: (walletName: string) => Promise<string>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextState>({
  connected: false,
  publicKey: null,
  walletName: null,
  connect: async () => "",
  disconnect: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SolanaWalletProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  publicKey?: { toString: () => string } | null;
}

interface EthereumProvider {
  isMetaMask?: boolean;
  isBinance?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

declare global {
  interface Window {
    solana?: SolanaWalletProvider;
    phantom?: { solana?: SolanaWalletProvider };
    solflare?: SolanaWalletProvider;
    backpack?: SolanaWalletProvider;
    xnft?: { solana?: SolanaWalletProvider };
    ethereum?: EthereumProvider;
    BinanceChain?: EthereumProvider;
  }
}

/* ------------------------------------------------------------------ */
/*  Wait for wallet injection (MetaMask injects asynchronously)        */
/* ------------------------------------------------------------------ */

function waitForEthereum(timeout = 3000): Promise<EthereumProvider | null> {
  return new Promise((resolve) => {
    // Already available
    if (typeof window !== "undefined" && window.ethereum) {
      resolve(window.ethereum);
      return;
    }

    // Listen for the injection event MetaMask fires
    const handler = () => {
      if (window.ethereum) {
        resolve(window.ethereum);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ethereum#initialized", handler, { once: true });
    }

    // Fallback: poll every 100ms
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.ethereum) {
        clearInterval(interval);
        resolve(window.ethereum);
      }
    }, 100);

    // Give up after timeout
    setTimeout(() => {
      clearInterval(interval);
      resolve(typeof window !== "undefined" ? window.ethereum ?? null : null);
    }, timeout);
  });
}

/* ------------------------------------------------------------------ */
/*  Detect & connect                                                   */
/* ------------------------------------------------------------------ */

function getSolanaProvider(name: string): SolanaWalletProvider | null {
  if (typeof window === "undefined") return null;

  switch (name) {
    case "Phantom":
      return window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null);
    case "Solflare":
      return window.solflare ?? (window.solana?.isSolflare ? window.solana : null);
    case "Backpack":
      return window.backpack ?? window.xnft?.solana ?? null;
    default:
      return null;
  }
}

async function connectSolana(provider: SolanaWalletProvider): Promise<string> {
  const resp = await provider.connect();
  return resp.publicKey.toString();
}

async function connectEVM(provider: EthereumProvider): Promise<string> {
  // This triggers the wallet popup asking the user to authorize
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error("用户拒绝了授权或未返回账户");
  }
  return accounts[0];
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);

  const connect = useCallback(async (name: string): Promise<string> => {
    // ── Solana wallets ──
    if (name === "Phantom" || name === "Solflare" || name === "Backpack") {
      const solProvider = getSolanaProvider(name);
      if (!solProvider) {
        throw new Error(`未检测到 ${name} 钱包扩展，请先安装`);
      }
      const key = await connectSolana(solProvider);
      setPublicKey(key);
      setConnected(true);
      setWalletName(name);
      return key;
    }

    // ── EVM wallets (MetaMask / Binance Wallet) ──
    if (name === "MetaMask" || name === "Binance Wallet") {
      // Wait for window.ethereum to be injected
      const ethereum = await waitForEthereum();

      if (name === "Binance Wallet") {
        // Prefer dedicated BinanceChain provider if available
        const bnb = typeof window !== "undefined" ? window.BinanceChain : null;
        if (bnb) {
          const address = await connectEVM(bnb);
          setPublicKey(address);
          setConnected(true);
          setWalletName(name);
          return address;
        }
      }

      if (!ethereum) {
        throw new Error(`未检测到 ${name} 钱包扩展，请先安装`);
      }

      // Call eth_requestAccounts — this is what triggers the wallet authorization popup
      const address = await connectEVM(ethereum);
      setPublicKey(address);
      setConnected(true);
      setWalletName(name);
      return address;
    }

    throw new Error(`不支持的钱包: ${name}`);
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setConnected(false);
    setWalletName(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ connected, publicKey, walletName, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}
