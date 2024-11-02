// Client
import { getMint, getAssociatedTokenAddressSync, createAccount } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
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

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const wallet = provider.wallet as anchor.Wallet;
console.log("wallet", wallet.publicKey.toBase58());
const connection = provider.connection;
const idl = JSON.parse(
    fs.readFileSync("./target/idl/solana_treasury.json", "utf8")
);

const treasuryKeypairBuffer = JSON.parse(fs.readFileSync("/home/riolis/.config/solana/keypair.json", "utf8"));
const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(treasuryKeypairBuffer)
);

const program = new anchor.Program(
    idl,
    provider
) as anchor.Program<SolanaTreasury>;