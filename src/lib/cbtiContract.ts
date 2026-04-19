/**
 * CBTI Contract client — builds the mint_cbti_nft transaction
 * for the user's wallet to sign and send.
 *
 * Program ID: 8pRoit4nEJSi4dJbHQ9JdJxgjN7EkYxthrm1UyKTXxgk
 * Cluster: devnet
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

// ── Constants ──

const PROGRAM_ID = new PublicKey("8pRoit4nEJSi4dJbHQ9JdJxgjN7EkYxthrm1UyKTXxgk");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const DEVNET_RPC = "https://api.devnet.solana.com";

// ── Helpers ──

function getAssociatedTokenAddress(wallet: PublicKey, mint: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

function getCbtiMetadataAddress(mint: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from("cbti"), mint.toBuffer()],
    PROGRAM_ID
  );
  return address;
}

function getMetaplexMetadataAddress(mint: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    METADATA_PROGRAM_ID
  );
  return address;
}

/**
 * Borsh-serialize a string: 4-byte LE length prefix + UTF-8 bytes
 */
function serializeString(s: string): Buffer {
  const bytes = Buffer.from(s, "utf-8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

/**
 * Build the Anchor instruction discriminator for "mint_cbti_nft"
 * Anchor uses sha256("global:mint_cbti_nft")[0..8]
 */
async function getDiscriminator(): Promise<Buffer> {
  const msgBuffer = new TextEncoder().encode("global:mint_cbti_nft");
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Buffer.from(new Uint8Array(hashBuffer).slice(0, 8));
}

// ── Public API ──

export interface MintCbtiNftParams {
  name: string;
  cnName: string;
  oneLiner: string;
  cv: number;
  tm: number;
  im: number;
  cp: number;
  cu: number;
  rarity: string;
  uri: string;
}

export interface MintResult {
  txSignature: string;
  mintAddress: string;
}

/**
 * Build and send a mint_cbti_nft transaction.
 *
 * @param walletPublicKey - The user's Solana wallet public key
 * @param signTransaction - Function from the wallet adapter to sign the tx
 * @param params - CBTI NFT metadata parameters
 * @returns Transaction signature and mint address
 */
export async function mintCbtiNft(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  params: MintCbtiNftParams
): Promise<MintResult> {
  const connection = new Connection(DEVNET_RPC, "confirmed");

  // Generate a new keypair for the mint account
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Derive PDAs
  const tokenAccount = getAssociatedTokenAddress(walletPublicKey, mint);
  const cbtiMetadata = getCbtiMetadataAddress(mint);
  const metaplexMetadata = getMetaplexMetadataAddress(mint);

  // Build instruction data
  const discriminator = await getDiscriminator();
  const data = Buffer.concat([
    discriminator,
    serializeString(params.name),
    serializeString(params.cnName),
    serializeString(params.oneLiner),
    Buffer.from([params.cv, params.tm, params.im, params.cp, params.cu]),
    serializeString(params.rarity),
    serializeString(params.uri),
  ]);

  // Allocate space for the mint account (82 bytes for SPL Token Mint)
  const mintRent = await connection.getMinimumBalanceForRentExemption(82);
  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: walletPublicKey,
    newAccountPubkey: mint,
    space: 82,
    lamports: mintRent,
    programId: TOKEN_PROGRAM_ID,
  });

  // Build the mint_cbti_nft instruction
  const mintIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: walletPublicKey, isSigner: true, isWritable: true },    // payer
      { pubkey: mint, isSigner: true, isWritable: true },               // mint
      { pubkey: tokenAccount, isSigner: false, isWritable: true },      // token_account
      { pubkey: cbtiMetadata, isSigner: false, isWritable: true },      // cbti_metadata
      { pubkey: metaplexMetadata, isSigner: false, isWritable: true },  // metadata_account
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });

  // Build transaction
  const tx = new Transaction();
  tx.add(createMintAccountIx);
  tx.add(mintIx);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = walletPublicKey;

  // The mint keypair must sign (it's a new account)
  tx.partialSign(mintKeypair);

  // User's wallet signs
  const signedTx = await signTransaction(tx);

  // Send and confirm
  const rawTx = signedTx.serialize();
  const txSignature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction(
    { signature: txSignature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return {
    txSignature,
    mintAddress: mint.toBase58(),
  };
}
