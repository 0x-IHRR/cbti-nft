# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CBTI (Crypto Bagholder Type Index) — a Web3 quiz app that analyzes crypto user behavior through 8 questions, maps results to one of 20 archetypes, and mints a Solana NFT. Built with Next.js 16 (App Router), Tailwind CSS v4, Zustand, and an Anchor smart contract on Solana devnet.

## Commands

```bash
npm run dev           # Start Next.js dev server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint via next lint
npm test              # Run all tests once (vitest)
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI
vitest run src/test/scoreEngine.test.ts  # Run a single test file
```

### Solana Contract

```bash
cd cbti-contract
anchor build          # Build the Anchor program
anchor test           # Run contract tests
anchor deploy         # Deploy to configured cluster
```

## Architecture

### User Flow

```
Landing (/) → Quiz (/quiz) → Calibrate (/calibrate) → Result (/result) → Share (/share)
```

1. `/quiz` — 8 questions randomly selected from bank (5 groups, guaranteeing coverage)
2. `/calibrate` — Connect wallet, simulate on-chain behavior analysis
3. `/result` — Display archetype with dimension scores, offer NFT mint
4. `/share` — Social sharing with OG image support

### Core Scoring Pipeline

`quizEngine.ts` (select 8 questions) → `scoreEngine.ts` (+2 strong, +1 secondary per answer) → `typeMapper.ts` (priority-based rules → 20 archetypes) → `walletCalibrator.ts` (adjust scores from wallet behavior)

All scoring logic is pure functions in `src/lib/`. Dimensions: `CV` (Conviction), `TM` (Timing), `IM` (Impulse), `CP` (Copium), `CU` (Curiosity).

### State Management

Single Zustand store (`src/store/cbtiStore.ts`) holds all quiz state, scores, archetype, and wallet info. No server-side persistence — everything is client-side memory.

### API Routes

- `POST /api/questions/start` — Server-side question selection (prevents cheating, strips dimension metadata from response)
- `POST /api/questions/submit` — Validate and record answers
- `POST /api/wallet/calibrate` — Wallet behavior analysis (simulated)
- `POST /api/nft/mint` — NFT minting orchestration
- `GET /api/og` — Dynamic OG image generation for sharing

### Solana Integration

- Program ID: `8pRoit4nEJSi4dJbHQ9JdJxgjN7EkYxthrm1UyKTXxgk` (devnet)
- Contract: `cbti-contract/programs/cbti-contract/src/lib.rs` — single instruction `mint_cbti_nft`
- Client: `src/lib/cbtiContract.ts` — builds transaction with Borsh serialization, manual Anchor discriminator (sha256)
- Uses raw `@solana/web3.js` (no wallet adapter framework), `WalletProvider.tsx` handles multi-wallet support (Phantom, MetaMask, Binance)

### Key Design Decisions

- **React strict mode disabled** (`next.config.ts`) — wallet connection issues with double-rendering
- **No database** — quiz data is static JSON, state lives in Zustand/memory only
- **Server-side question selection** — dimension mappings (`strongMatch`, `secondaryMatch`) are stripped before sending to client to prevent score manipulation
- **Wallet calibration is simulated** — uses hash-based deterministic simulation, production needs actual RPC calls
- **Canvas-based share card** — client-side image generation with 2x retina scaling, no server-side rendering

### Testing

Tests use Vitest + jsdom. Core business logic (`quizEngine`, `scoreEngine`, `typeMapper`) uses **property-based testing** via `fast-check` with 100+ runs per property. Test files in `src/test/` mirror their source counterparts in `src/lib/`.

## Conventions

- Path alias: `@/*` → `./src/*`
- All code uses TypeScript strict mode
- Types defined centrally in `src/lib/types.ts`
- Archetype data in `src/data/` (JSON)
- UI components in `src/components/`
