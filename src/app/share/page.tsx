import type { Metadata } from "next";
import Link from "next/link";
import archetypesData from "@/data/archetypes.json";

interface SharePageProps {
  searchParams: Promise<{ t?: string }>;
}

function findArchetype(name: string) {
  return archetypesData.find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );
}

export async function generateMetadata({
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const archetype = findArchetype(params.t || "");
  const name = archetype?.name || "Zen Holder";
  const cnName = archetype?.cnName || "佛系持仓者";
  const oneLiner = archetype?.oneLiner || "测测你是哪种 Crypto Degen";

  const ogImageUrl = `/api/og?name=${encodeURIComponent(name)}&cnName=${encodeURIComponent(cnName)}&oneLiner=${encodeURIComponent(oneLiner)}`;

  return {
    title: `CBTI: ${name}（${cnName}）`,
    description: oneLiner,
    openGraph: {
      title: `CBTI: ${name}（${cnName}）`,
      description: oneLiner,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `CBTI: ${name}（${cnName}）`,
      description: oneLiner,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const archetype = findArchetype(params.t || "");
  const name = archetype?.name || "Zen Holder";
  const cnName = archetype?.cnName || "佛系持仓者";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 bg-clip-text text-4xl font-extrabold text-transparent">
          {name}
        </h1>
        <p className="text-2xl font-bold text-gray-200">{cnName}</p>
        <p className="text-gray-400">这是 TA 的 CBTI 加密持仓者类型</p>
        <Link
          href="/"
          className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-105"
        >
          🚀 测测你是哪种 Degen
        </Link>
      </div>
    </main>
  );
}
