use anchor_lang::prelude::*;

pub mod state;
use state::*;

pub mod utils;

pub mod instructions;
use instructions::*;

declare_id!("Cb3CDEGAzbSciL6mb5NAc4pn45k6QyAae9S4agyfEJ2F");

const SEED: &[u8] = "bton_mint_authority".as_bytes();

const ADMIN_PUBKEY: Pubkey = pubkey!("aeWza7erizbMA3zNKW91ppftf8Rz8nyApRcumSSqebc");
const TREASURY: Pubkey = pubkey!("BCX4yK2kDsbTeUnwDHburaDF6DdLDkgDgsu4PvEhLxsL");

#[program]
pub mod solana_treasury {
    use super::*;

    const ETH_PUBKEY: [u8; 64] = [
        56, 72, 255, 236, 218, 141, 204, 182, 150, 13, 183, 212, 44, 74, 204, 172, 15, 166, 223,
        196, 65, 159, 30, 239, 123, 89, 153, 30, 151, 148, 152, 247, 54, 59, 187, 137, 4, 21, 149,
        174, 102, 134, 127, 186, 150, 183, 54, 4, 127, 45, 221, 227, 216, 217, 96, 56, 248, 250,
        78, 117, 120, 188, 233, 196,
    ];

    pub fn deposit(ctx: Context<Deposit>, data: DepositData) -> Result<()> {
        deposit::deposit(ctx, data)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, data: WithdrawData) -> Result<()> {
        withdraw::withdraw(ctx, data, ETH_PUBKEY)?;

        Ok(())
    }

    // Create new token mint with PDA as mint authority
    pub fn create_mint(
        ctx: Context<CreateMint>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        create_mint::create_mint(ctx, uri, name, symbol)?;

        Ok(())
    }
}
