use anchor_lang::prelude::*;

pub mod state;
use state::*;

pub mod utils;

pub mod instructions;
use instructions::*;

declare_id!("BtXkwL2S2aJi9Uu3XvUGVrhCLXzvreQg5PW8xFRd4PFw");

const SEED: &[u8] = "bton_mint_authority".as_bytes();

const ADMIN_PUBKEY: Pubkey = pubkey!("aeWza7erizbMA3zNKW91ppftf8Rz8nyApRcumSSqebc");
const TREASURY: Pubkey = pubkey!("39KJAvNd2hWjX9wCVqLjJNUhc9XAv5WHC24zBJ3Vi8B6");

#[program]
pub mod solana_treasury {
    use super::*;

    const ETH_PUBKEY: [u8; 64] = [
        14, 143, 175, 40, 31, 55, 231, 42, 152, 111, 124, 242, 57, 152, 3, 224, 251, 229, 241, 230,
        253, 73, 7, 18, 255, 183, 35, 236, 111, 38, 236, 173, 148, 139, 41, 159, 9, 195, 230, 154,
        174, 148, 242, 252, 113, 225, 251, 143, 62, 254, 176, 213, 138, 27, 196, 137, 41, 13, 72,
        134, 1, 206, 207, 72,
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
