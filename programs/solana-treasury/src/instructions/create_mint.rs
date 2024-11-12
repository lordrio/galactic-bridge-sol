use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata},
    token::{Mint, Token},
};
use mpl_token_metadata::types::DataV2;
use solana_program::pubkey::Pubkey;

use crate::*;

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(
        mut,
        address = ADMIN_PUBKEY
    )]
    pub admin: Signer<'info>,

    // The PDA is both the address of the mint account and the mint authority
    #[account(
        init,
        seeds = [SEED],
        bump,
        payer = admin,
        mint::decimals = 3,
        mint::authority = bton_token_mint
    )]
    pub bton_token_mint: Account<'info, Mint>,

    ///CHECK: Using "address" constraint to validate metadata account address
    #[account(
        mut,
        address=mpl_token_metadata::accounts::Metadata::find_pda(&bton_token_mint.key()).0
    )]
    pub metadata_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Create new token mint with PDA as mint authority
pub fn create_mint(
    ctx: Context<CreateMint>,
    uri: String,
    name: String,
    symbol: String,
) -> Result<()> {
    // PDA seeds and bump to "sign" for CPI
    let seeds = SEED;
    let bump = ctx.bumps.bton_token_mint;
    let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

    // On-chain token metadata for the mint
    let data_v2 = DataV2 {
        name: name,
        symbol: symbol,
        uri: uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    // CPI Context
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata_account.to_account_info(), // the metadata account being created
            mint: ctx.accounts.bton_token_mint.to_account_info(), // the mint account of the metadata account
            mint_authority: ctx.accounts.bton_token_mint.to_account_info(), // the mint authority of the mint account
            update_authority: ctx.accounts.bton_token_mint.to_account_info(), // the update authority of the metadata account
            payer: ctx.accounts.admin.to_account_info(), // the payer for creating the metadata account
            system_program: ctx.accounts.system_program.to_account_info(), // the system program account
            rent: ctx.accounts.rent.to_account_info(), // the rent sysvar account
        },
        signer,
    );

    create_metadata_accounts_v3(
        cpi_ctx, // cpi context
        data_v2, // token metadata
        true,    // is_mutable
        true,    // update_authority_is_signer
        None,    // collection details
    )?;

    Ok(())
}
