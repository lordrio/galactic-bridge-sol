// Client
import { getMint, getAssociatedTokenAddressSync, createAccount } from "@solana/spl-token";
import { clusterApiUrl, PublicKey, Connection, Keypair } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { SolanaTreasury } from "./target/types/solana_treasury";
import { ethers } from "ethers";
import * as crypto from "crypto";
import { Metaplex } from "@metaplex-foundation/js";
import fs from "fs";
import os from "os";
import { web3 } from "@coral-xyz/anchor";

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
const adminKeyPair = JSON.parse(fs.readFileSync("/home/riolis/.config/solana/id.json", "utf8")).slice(0,32);
const testKeyPair = JSON.parse(fs.readFileSync("/home/riolis/.config/solana/keypair.json", "utf8")).slice(0,32);
const testKP = Keypair.fromSeed(Uint8Array.from(testKeyPair));

const wallet = new anchor.Wallet(Keypair.fromSeed(Uint8Array.from(adminKeyPair)));
const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
);
anchor.setProvider(provider);
const idl = JSON.parse(
    fs.readFileSync("./target/idl/solana_treasury.json", "utf8")
);

const program = new anchor.Program(
    idl,
    provider
) as anchor.Program<SolanaTreasury>;

const treasuryPubkey = new PublicKey(
    "FB4zo7Ldu2BuYxrHKy9WXjYDC5FcpnDMz9sGQRmLNQWg"
);

console.log("program", program.programId.toBase58());

// reward token mint PDA
const [rewardTokenMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("bton_mint_authority")],
    program.programId
);

const treasuryTokenAccount = getAssociatedTokenAddressSync(
    rewardTokenMintPda,
    treasuryPubkey
);

console.log("treasuryTokenAccount", treasuryTokenAccount.toBase58());


// metaplex setup
const metaplex = Metaplex.make(connection);

async function createAccountForTreasury() {
    // create account 
    try {
      const txHash = await createAccount(
        connection,
        wallet.payer,
        rewardTokenMintPda,
        treasuryPubkey,
      );
      console.log("txHash", txHash);
    } catch (error) {
      console.log("error", error);
    }
}

createMint(connection, rewardTokenMintPda, program);
createAccountForTreasury();

async function createMint(
    connection,
    rewardTokenMintPda,
    program,
) {
    // reward token mint metadata account address
    const rewardTokenMintMetadataPDA = await metaplex
        .nfts()
        .pdas()
        .metadata({ mint: rewardTokenMintPda });

    console.log("rewardTokenMintMetadataPDA", rewardTokenMintMetadataPDA);

    // metaplex token metadata program ID
    const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    // token metadata
    const metadata = {
      uri: "https://co24lwj7fcsn5752gv7zctw6wsc72kmqsvhlxghdkxwrmtmnxndq.arweave.net/3i4T2bON0mrRD9NiUWl-rxf-WC0zaOSn-eZVoaFT83g/bton.json",
      name: "Solana BTON",
      symbol: "BTON",
    };

    let txHash;
    try {
      const mintData = await getMint(connection, rewardTokenMintPda);
      console.log("auth", mintData.mintAuthority.toBase58());
      console.log("freeze", mintData.freezeAuthority?.toBase58());
      console.log("Mint Already Exists");
    } catch {
      txHash = await program.methods
        .createMint(metadata.uri, metadata.name, metadata.symbol)
        .accounts({
          btonTokenMint: rewardTokenMintPda,
          metadataAccount: rewardTokenMintMetadataPDA,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();
      console.log("txHash", txHash);
    }
    console.log("Token Mint: ", rewardTokenMintPda.toString());
  }