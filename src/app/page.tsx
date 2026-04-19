import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <div className="flex flex-col items-center gap-8 text-center">
        <h1 className="bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-7xl font-extrabold tracking-tight text-transparent sm:text-8xl">
          CBTI
        </h1>
        <p className="max-w-md text-lg text-gray-400 sm:text-xl">
          🧠 加密持仓者类型指数 — 用 8 道灵魂拷问，测出你是哪种 Crypto Degen
        </p>
        <Link
          href="/quiz"
          className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-purple-500/30 transition hover:scale-105 hover:shadow-purple-500/50"
        >
          🚀 开始测试
        </Link>
      </div>
    </main>
  );
}
