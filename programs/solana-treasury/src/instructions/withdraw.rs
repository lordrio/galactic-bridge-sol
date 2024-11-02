use std::str::FromStr;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

use crate::{storage, TREASURY};
use crate::{utils, SEED};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Coupon {
    from_icp_address: String,
    to_sol_address: String,
    amount: String,
    burn_id: u64,
    burn_timestamp: String,
    icp_burn_block_index: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct WithdrawData {
    pub message: Vec<u8>,
    pub signature: [u8; 64],
    pub coupon: Coupon,
    pub recovery_id: u8,
}

#[error_code]
pub enum WithdrawError {
    #[msg("Treasury is not signer")]
    TreasuryNotSigner,
    #[msg("Insufficient treasury amount")]
    TreasuryInsufficientAmount,
    #[msg("Keys dont match")]
    KeysDontMatch,
    #[msg("Signature is used")]
    SignatureUsed,
    #[msg("Context receiver does not match coupon address")]
    ReceiverMismatch,
    #[msg("Context receiver cannot cover rent exemption")]
    ReceiverCannotCoverRentExemption,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    /// CHECK: this is safe because hashed message and signature have been verified
    pub receiver: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: this is safe because hash of signature is unique and verified
    pub hashed_signature_pubkey: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            hashed_signature_pubkey.key().as_ref(),
        ],
        bump,
    )]
    pub signature_pda: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = bton_token_mint,
        associated_token::authority = payer
    )]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = TREASURY,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [SEED],
        bump,
    )]
    pub bton_token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw(ctx: Context<Withdraw>, data: WithdrawData, eth_pubkey: [u8; 64]) -> Result<()> {
    let addr = Pubkey::from_str(&data.coupon.to_sol_address).expect("Invalid Coupon Address");

    // Add this check to ensure token account belongs to receiver
    if ctx.accounts.payer_token_account.owner != addr {
        return err!(WithdrawError::KeysDontMatch);
    }

    if ctx.accounts.receiver.key() != addr {
        return err!(WithdrawError::ReceiverMismatch);
    }

    let rent_exempt_lamports = Rent::get()?.minimum_balance(ctx.accounts.receiver.data_len());
    if rent_exempt_lamports > ctx.accounts.receiver.lamports() {
        return err!(WithdrawError::ReceiverCannotCoverRentExemption);
    }

    let transfer_amount_string = data.coupon.amount.replace('_', "");
    let transfer_amount = transfer_amount_string
        .parse::<u64>()
        .unwrap_or_else(|_| panic!("Invalid amount format: {}", transfer_amount_string));

    let timestamp =
        u64::from_str(&data.coupon.burn_timestamp).expect("Could not convert timestamp to u64");

    utils::verify_message(
        &data.message,
        &data.coupon.from_icp_address,
        &data.coupon.to_sol_address,
        &data.coupon.amount,
        &data.coupon.burn_id,
        &timestamp,
        &data.coupon.icp_burn_block_index,
    )?;

    utils::verify_signature(
        &eth_pubkey,
        &data.message,
        &data.signature,
        data.recovery_id,
    )?;

    // seems like to be for creating account
    storage::signature_pda_check(&ctx, &data)?;

    // PDA seeds and bump to "sign" for CPI
    let seeds = SEED;
    let bump = ctx.bumps.bton_token_mint;
    let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

    let cpi_ctx_tax = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.bton_token_mint.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.bton_token_mint.to_account_info(),
        },
        signer,
    );

    // 5% tax
    let amount_tax = (transfer_amount as f64 * 0.05).ceil() as u64;

    mint_to(cpi_ctx_tax, amount_tax)?;

    // CPI Context
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.bton_token_mint.to_account_info(),
            to: ctx.accounts.payer_token_account.to_account_info(),
            authority: ctx.accounts.bton_token_mint.to_account_info(),
        },
        signer,
    );

    // Mint 1 token, accounting for decimals of mint
    let amount = transfer_amount - amount_tax;

    mint_to(cpi_ctx, amount)?;
    Ok(())
}
