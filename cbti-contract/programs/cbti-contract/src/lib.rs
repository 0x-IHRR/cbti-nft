use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;

declare_id!("8pRoit4nEJSi4dJbHQ9JdJxgjN7EkYxthrm1UyKTXxgk");

/// SPL Token program ID
pub const TOKEN_PROGRAM_ID: Pubkey =
    solana_pubkey::pubkey!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

/// Associated Token Account program ID
pub const ASSOCIATED_TOKEN_PROGRAM_ID: Pubkey =
    solana_pubkey::pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

/// Metaplex Token Metadata program ID
pub const METADATA_PROGRAM_ID: Pubkey =
    solana_pubkey::pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const MAX_NAME_LEN: usize = 64;
const MAX_CN_NAME_LEN: usize = 64;
const MAX_ONE_LINER_LEN: usize = 256;
const MAX_URI_LEN: usize = 200;

#[program]
pub mod cbti_contract {
    use super::*;

    /// Mint a CBTI NFT identity card.
    ///
    /// Flow:
    /// 1. Initialize a new SPL Token mint (decimals=0)
    /// 2. Create the user's associated token account
    /// 3. Mint exactly 1 token to the user
    /// 4. Store CBTI dimension scores + archetype data in a PDA
    /// 5. Create Metaplex token metadata for wallet/marketplace display
    pub fn mint_cbti_nft(
        ctx: Context<MintCbtiNft>,
        name: String,
        cn_name: String,
        one_liner: String,
        cv: u8,
        tm: u8,
        im: u8,
        cp: u8,
        cu: u8,
        rarity: String,
        uri: String,
    ) -> Result<()> {
        require!(name.len() <= MAX_NAME_LEN, CbtiError::NameTooLong);
        require!(cn_name.len() <= MAX_CN_NAME_LEN, CbtiError::CnNameTooLong);
        require!(
            one_liner.len() <= MAX_ONE_LINER_LEN,
            CbtiError::OneLinerTooLong
        );
        require!(uri.len() <= MAX_URI_LEN, CbtiError::UriTooLong);

        let payer = &ctx.accounts.payer;
        let mint = &ctx.accounts.mint;
        let token_account = &ctx.accounts.token_account;

        // ── 1. Initialize Mint (decimals=0, authority=payer) ──
        invoke(
            &spl_initialize_mint_ix(
                &TOKEN_PROGRAM_ID,
                &mint.key(),
                &payer.key(),
                None,
                0,
            ),
            &[
                mint.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;

        // ── 2. Create Associated Token Account ──
        invoke(
            &spl_create_associated_token_account_ix(
                &payer.key(),
                &payer.key(),
                &mint.key(),
                &TOKEN_PROGRAM_ID,
            ),
            &[
                payer.to_account_info(),
                token_account.to_account_info(),
                payer.to_account_info(),
                mint.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
            ],
        )?;

        // ── 3. Mint 1 token ──
        invoke(
            &spl_mint_to_ix(&TOKEN_PROGRAM_ID, &mint.key(), &token_account.key(), &payer.key(), 1),
            &[
                mint.to_account_info(),
                token_account.to_account_info(),
                payer.to_account_info(),
            ],
        )?;

        // ── 4. Store CBTI metadata in PDA ──
        let cbti_metadata = &mut ctx.accounts.cbti_metadata;
        cbti_metadata.mint = mint.key();
        cbti_metadata.owner = payer.key();
        cbti_metadata.name = name.clone();
        cbti_metadata.cn_name = cn_name.clone();
        cbti_metadata.one_liner = one_liner.clone();
        cbti_metadata.cv = cv;
        cbti_metadata.tm = tm;
        cbti_metadata.im = im;
        cbti_metadata.cp = cp;
        cbti_metadata.cu = cu;
        cbti_metadata.rarity = rarity;
        cbti_metadata.created_at = Clock::get()?.unix_timestamp;

        // ── 5. Create Metaplex metadata ──
        let create_metadata_ix = create_metadata_accounts_v3_ix(
            &METADATA_PROGRAM_ID,
            &ctx.accounts.metadata_account.key(),
            &mint.key(),
            &payer.key(),
            &payer.key(),
            &payer.key(),
            name,
            "CBTI".to_string(),
            uri,
        );
        invoke(
            &create_metadata_ix,
            &[
                ctx.accounts.metadata_account.to_account_info(),
                mint.to_account_info(),
                payer.to_account_info(),
                payer.to_account_info(),
                payer.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;

        msg!("CBTI NFT minted successfully");
        Ok(())
    }
}

// ─── Raw instruction builders (no anchor-spl dependency) ─────────────

fn spl_initialize_mint_ix(
    token_program_id: &Pubkey,
    mint: &Pubkey,
    mint_authority: &Pubkey,
    freeze_authority: Option<&Pubkey>,
    decimals: u8,
) -> anchor_lang::solana_program::instruction::Instruction {
    let mut data = vec![0u8]; // InitializeMint instruction index
    data.push(decimals);
    data.extend_from_slice(mint_authority.as_ref());
    // COption<Pubkey> for freeze authority
    match freeze_authority {
        Some(fa) => {
            data.extend_from_slice(&[1, 0, 0, 0]);
            data.extend_from_slice(fa.as_ref());
        }
        None => {
            data.extend_from_slice(&[0, 0, 0, 0]);
        }
    }

    anchor_lang::solana_program::instruction::Instruction {
        program_id: *token_program_id,
        accounts: vec![
            anchor_lang::solana_program::instruction::AccountMeta::new(*mint, false),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                anchor_lang::solana_program::sysvar::rent::id(),
                false,
            ),
        ],
        data,
    }
}

fn spl_create_associated_token_account_ix(
    funding_address: &Pubkey,
    wallet_address: &Pubkey,
    token_mint_address: &Pubkey,
    token_program_id: &Pubkey,
) -> anchor_lang::solana_program::instruction::Instruction {
    let associated_account_address = get_associated_token_address(wallet_address, token_mint_address);

    anchor_lang::solana_program::instruction::Instruction {
        program_id: ASSOCIATED_TOKEN_PROGRAM_ID,
        accounts: vec![
            anchor_lang::solana_program::instruction::AccountMeta::new(*funding_address, true),
            anchor_lang::solana_program::instruction::AccountMeta::new(associated_account_address, false),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*wallet_address, false),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*token_mint_address, false),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                anchor_lang::solana_program::system_program::id(),
                false,
            ),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*token_program_id, false),
        ],
        data: vec![],
    }
}

fn get_associated_token_address(wallet: &Pubkey, mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[
            wallet.as_ref(),
            TOKEN_PROGRAM_ID.as_ref(),
            mint.as_ref(),
        ],
        &ASSOCIATED_TOKEN_PROGRAM_ID,
    )
    .0
}

fn spl_mint_to_ix(
    token_program_id: &Pubkey,
    mint: &Pubkey,
    account: &Pubkey,
    owner: &Pubkey,
    amount: u64,
) -> anchor_lang::solana_program::instruction::Instruction {
    let mut data = vec![7u8]; // MintTo instruction index
    data.extend_from_slice(&amount.to_le_bytes());

    anchor_lang::solana_program::instruction::Instruction {
        program_id: *token_program_id,
        accounts: vec![
            anchor_lang::solana_program::instruction::AccountMeta::new(*mint, false),
            anchor_lang::solana_program::instruction::AccountMeta::new(*account, false),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*owner, true),
        ],
        data,
    }
}

/// Build a CreateMetadataAccountsV3 instruction for Metaplex.
fn create_metadata_accounts_v3_ix(
    program_id: &Pubkey,
    metadata_account: &Pubkey,
    mint: &Pubkey,
    mint_authority: &Pubkey,
    payer: &Pubkey,
    update_authority: &Pubkey,
    name: String,
    symbol: String,
    uri: String,
) -> anchor_lang::solana_program::instruction::Instruction {
    // Borsh-serialize the CreateMetadataAccountsV3 instruction
    // Instruction discriminator = 33 (CreateMetadataAccountV3)
    let mut data: Vec<u8> = vec![33];

    // DataV2 struct
    borsh_serialize_string(&mut data, &name);
    borsh_serialize_string(&mut data, &symbol);
    borsh_serialize_string(&mut data, &uri);
    data.extend_from_slice(&0u16.to_le_bytes()); // seller_fee_basis_points
    // Option<Vec<Creator>> = None
    data.push(0);
    // Option<Collection> = None
    data.push(0);
    // Option<Uses> = None
    data.push(0);

    // is_mutable: bool
    data.push(1);

    // Option<CollectionDetails> = None
    data.push(0);

    anchor_lang::solana_program::instruction::Instruction {
        program_id: *program_id,
        accounts: vec![
            anchor_lang::solana_program::instruction::AccountMeta::new(*metadata_account, false),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*mint, false),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*mint_authority, true),
            anchor_lang::solana_program::instruction::AccountMeta::new(*payer, true),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(*update_authority, false),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                anchor_lang::solana_program::system_program::id(),
                false,
            ),
            anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                anchor_lang::solana_program::sysvar::rent::id(),
                false,
            ),
        ],
        data,
    }
}

fn borsh_serialize_string(buf: &mut Vec<u8>, s: &str) {
    buf.extend_from_slice(&(s.len() as u32).to_le_bytes());
    buf.extend_from_slice(s.as_bytes());
}

// ─── Accounts ────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct MintCbtiNft<'info> {
    /// The user paying for the mint and receiving the NFT.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The NFT mint account. Must be pre-allocated with enough space for an SPL Mint
    /// (82 bytes) and owned by the Token program.
    /// CHECK: Initialized via CPI to SPL Token InitializeMint.
    #[account(mut)]
    pub mint: Signer<'info>,

    /// The user's associated token account for this mint.
    /// CHECK: Created via CPI to Associated Token program.
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,

    /// CBTI-specific metadata PDA, seeded by ["cbti", mint].
    #[account(
        init,
        payer = payer,
        space = 8 + CbtiMetadata::INIT_SPACE,
        seeds = [b"cbti", mint.key().as_ref()],
        bump,
    )]
    pub cbti_metadata: Account<'info, CbtiMetadata>,

    /// Metaplex metadata account PDA.
    /// CHECK: Created by the Metaplex metadata program via CPI.
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: SPL Token program.
    #[account(address = TOKEN_PROGRAM_ID)]
    pub token_program: UncheckedAccount<'info>,

    /// CHECK: Associated Token program.
    #[account(address = ASSOCIATED_TOKEN_PROGRAM_ID)]
    pub associated_token_program: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata program.
    #[account(address = METADATA_PROGRAM_ID)]
    pub metadata_program: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
}

// ─── State ───────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct CbtiMetadata {
    pub mint: Pubkey,
    pub owner: Pubkey,
    #[max_len(64)]
    pub name: String,
    #[max_len(64)]
    pub cn_name: String,
    #[max_len(256)]
    pub one_liner: String,
    pub cv: u8,
    pub tm: u8,
    pub im: u8,
    pub cp: u8,
    pub cu: u8,
    #[max_len(16)]
    pub rarity: String,
    pub created_at: i64,
}

// ─── Errors ──────────────────────────────────────────────────────────

#[error_code]
pub enum CbtiError {
    #[msg("Name exceeds maximum length of 64 bytes")]
    NameTooLong,
    #[msg("Chinese name exceeds maximum length of 64 bytes")]
    CnNameTooLong,
    #[msg("One-liner exceeds maximum length of 256 bytes")]
    OneLinerTooLong,
    #[msg("URI exceeds maximum length of 200 bytes")]
    UriTooLong,
}
