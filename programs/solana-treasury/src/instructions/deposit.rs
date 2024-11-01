use {
    crate::SEED,
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{burn, Burn, Mint, Token, TokenAccount},
    },
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DepositData {
    address_icp: String,
    amount: u64,
}

#[error_code]
pub enum DepositError {
    #[msg("Payer is not signer")]
    PayerNotSigner,
    #[msg("Insufficient payer's amount")]
    PayerInsufficientAmount,
    #[msg("Amount must be larger that zero")]
    InvalidAmount,
}

#[event]
pub struct DepositEvent {
    pub address_icp: String,
    pub amount: u64,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    payer: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = bton_token_mint,
        associated_token::authority = payer
    )]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [SEED],
        bump,
    )]
    pub bton_token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn deposit(ctx: Context<Deposit>, data: DepositData) -> Result<()> {
    if !ctx.accounts.payer.is_signer {
        return err!(DepositError::PayerNotSigner);
    }

    let transfer_amount = data.amount;
    if transfer_amount == 0 {
        return err!(DepositError::InvalidAmount);
    }

    let balance = ctx.accounts.payer_token_account.amount;
    if balance < transfer_amount {
        return err!(DepositError::PayerInsufficientAmount);
    }

    // CPI Context
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.bton_token_mint.to_account_info(),
            from: ctx.accounts.payer_token_account.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        },
    );

    burn(cpi_ctx, transfer_amount)?;

    emit!(DepositEvent {
        address_icp: data.address_icp,
        amount: transfer_amount,
    });

    Ok(())
}
