import * as anchor from "@coral-xyz/anchor";
import { SolanaTreasury } from "../target/types/solana_treasury";
import { PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import * as crypto from "crypto";
import { Metaplex } from "@metaplex-foundation/js";
import { deposit } from "./tests/deposit";
import { getMint, getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  withdrawFailsDueToIncorrectRecoveryId,
  withdrawFailsDueToInvalidCoupon,
  withdrawFailsDueToInvalidCouponHash,
  withdrawFailsDueToInvalidSignature,
  withdrawFailsDueToInvalidSignaturePda,
  withdrawFailsDueToInvalidSignaturePubkey,
  withdrawFailsDueToInvalidSignaturePubkeyAndPda,
  withdrawFailsDueToReceiverMismatch,
  withdrawFailsDueToUsedSignature,
} from "./tests/withdraw-fails";
import { withdrawWithValidSignatureAndData } from "./tests/withdraw-success";
import {
  setWithdrawOwnerInterval,
  setWithdrawOwnerIntervalFailsCallerNotOwner,
  setWithdrawOwnerIntervalFailsInvalidDuration,
  setWithdrawOwnerIntervalFailsInvalidStartSlot,
  withdrawOwnerFailsCallerNotOwner,
  withdrawOwnerFailsExpiredInterval,
  withdrawOwnerFailsNoSetInterval,
  withdrawOwnerWithSetInterval,
} from "./tests/withdraw-owner";
import { web3 } from "@coral-xyz/anchor";
const fs = require("fs");

describe("Treasury", async () => {
  let treasuryMeta;

  before(async () => {
    const _treasuryMeta = await initializeSolanaTreasuryMeta();
    treasuryMeta = _treasuryMeta;
    await rentExemptReceiverAccountOK(treasuryMeta);
    await createMint(treasuryMeta);
  });

  // it("Deposit SOL and check event", async () => {
  //   await deposit(treasuryMeta);
  // });

  it("Fails to withdraw due to invalid coupon", async () => {
    await withdrawFailsDueToInvalidCoupon(treasuryMeta);
  });

  it("Fails to withdraw due to invalid signature", async () => {
    withdrawFailsDueToInvalidSignature(treasuryMeta);
  });

  it("Fails to withdraw due to invalid coupon hash", async () => {
    await withdrawFailsDueToInvalidCouponHash(treasuryMeta);
  });

  it("Fails to withdraw due to invalid signature pubkey", async () => {
    await withdrawFailsDueToInvalidSignaturePubkey(treasuryMeta);
  });

  it("Fails to withdraw due to invalid signature pda", async () => {
    await withdrawFailsDueToInvalidSignaturePda(treasuryMeta);
  });

  it("Fails to withdraw due to invalid signature pubkey and pda", async () => {
    await withdrawFailsDueToInvalidSignaturePubkeyAndPda(treasuryMeta);
  });

  it("Fails to withdraw due to invalid recovery id", async () => {
    await withdrawFailsDueToIncorrectRecoveryId(treasuryMeta);
  });

  it("Fails to withdraw due to invalid receiver", async () => {
    await withdrawFailsDueToReceiverMismatch(treasuryMeta);
  });

  it("Withdraws with valid signature and data", async () => {
    await withdrawWithValidSignatureAndData(treasuryMeta);
  });

  // it("Fails to withdraw due to used signature", async () => {
  //   await withdrawFailsDueToUsedSignature(treasuryMeta);
  // });


  const initializeSolanaTreasuryMeta = async () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const wallet = provider.wallet as anchor.Wallet;
    console.log("wallet", wallet.publicKey.toBase58());
    const connection = provider.connection;
    const idl = JSON.parse(
      fs.readFileSync("./target/idl/solana_treasury.json", "utf8")
    );

    const keypairBuffer = JSON.parse(
      fs.readFileSync("./target/deploy/solana_treasury-keypair.json", "utf8")
    );
    const programKeypair = anchor.web3.Keypair.fromSecretKey(
      new Uint8Array(keypairBuffer)
    );

    const program = new anchor.Program(
      idl,
      provider
    ) as anchor.Program<SolanaTreasury>;

    // PDA for the Treasury Vault
    const [treasuryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    const [withdrawOwnerIntervalPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("withdraw_owner_interval")],
      program.programId
    );

    const coupon = {
      from_icp_address:
        "pvmak-bbryo-hipdn-slp5u-fpsh5-tkf7f-v2wss-534um-jc454-ommhu-2qe",
      to_sol_address: "8nZLXraZUARNmU3P8PKbJMS7NYs7aEyw6d1aQx1km3t2",
      amount: "10_000_000",
      burn_id: 0,
      burn_timestamp: "1716994668977025165",
      icp_burn_block_index: 2,
    };

    const couponHash =
      "0x" + "153e935d5ba866812c6ae00095c9f765df08aee57df63dc638d2e888bd92cf4a";
    const sig =
      "0x" +
      "02f0d597f3bbaf02efb1d42ebd3e725317d99c94cc1315fadf2195471f90ee6a69dc667a11188e67e3a126048a2f1454e102f23fba83e2ea04ee439ebc88ed5a";
    const recoveryId = 0;

    const sigHashed = crypto
      .createHash("sha256")
      .update(ethers.toBeArray(sig))
      .digest();

    const sigHashedBytes = sigHashed.toJSON().data;
    const hashedSignaturePubkey = new PublicKey(sigHashedBytes);
    const [signaturePda] = PublicKey.findProgramAddressSync(
      [hashedSignaturePubkey.toBuffer()],
      program.programId
    );
    const receiverPubkey = new PublicKey(coupon.to_sol_address);

    // metaplex setup
    const metaplex = Metaplex.make(connection);

    // reward token mint PDA
    const [rewardTokenMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bton_mint_authority")],
      program.programId
    );

    // reward token mint metadata account address
    const rewardTokenMintMetadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: rewardTokenMintPda });

    console.log("rewardTokenMintMetadataPDA", rewardTokenMintMetadataPDA);

    // player token account address
    const playerTokenAccount = getAssociatedTokenAddressSync(
      rewardTokenMintPda,
      wallet.publicKey
    );

    const treasuryTokenAccount = getAssociatedTokenAddressSync(
      rewardTokenMintPda,
      new PublicKey("aeWza7erizbMA3zNKW91ppftf8Rz8nyApRcumSSqebc")
    );

    return {
      provider,
      wallet,
      connection,
      program,
      treasuryPDA,
      withdrawOwnerIntervalPDA,
      coupon,
      couponHash,
      sig,
      recoveryId,
      hashedSignaturePubkey,
      signaturePda,
      receiverPubkey,
      rewardTokenMintPda,
      rewardTokenMintMetadataPDA,
      playerTokenAccount,
      treasuryTokenAccount,
    };
  };

  const createMint = async ({
    connection,
    rewardTokenMintPda,
    rewardTokenMintMetadataPDA,
    program,
  }) => {
    // metaplex token metadata program ID
    const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    // token metadata
    const metadata = {
      uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
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

  const rentExemptReceiverAccountOK = async ({
    connection,
    receiverPubkey,
    wallet,
    provider,
  }) => {
    const walletBalanceInitial = await connection.getBalance(receiverPubkey);
    const minBalance = await connection.getMinimumBalanceForRentExemption(1);
    const isRentExempt = walletBalanceInitial >= minBalance;
    console.log("isRentExempt", isRentExempt);
    console.log("walletBalanceInitial", walletBalanceInitial);
    console.log("minBalance", minBalance);
    if (!isRentExempt) {
      const transaction = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: receiverPubkey,
          lamports: minBalance,
        })
      );
      await provider.sendAndConfirm(transaction, [wallet.payer]);
    }
  };
});
