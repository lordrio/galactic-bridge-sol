import * as anchor from "@coral-xyz/anchor";
import { SolanaTreasury } from "../target/types/solana_treasury";
import { PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import * as crypto from "crypto";
import { Metaplex } from "@metaplex-foundation/js";
import { deposit } from "./tests/deposit";
import { getMint, getAssociatedTokenAddressSync, createAccount } from "@solana/spl-token";
import {
  withdrawFailsDueToIncorrectRecoveryId,
  withdrawFailsDueToInvalidCoupon,
  withdrawFailsDueToInvalidCouponHash,
  withdrawFailsDueToInvalidSignature,
  withdrawFailsDueToInvalidSignaturePda,
  withdrawFailsDueToInvalidSignaturePubkey,
  withdrawFailsDueToInvalidSignaturePubkeyAndPda,
  withdrawFailsDueToKeysDontMatch,
  withdrawFailsDueToReceiverMismatch,
  withdrawFailsDueToTreasuryMismatch,
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

  it("Fails to withdraw due to keys don't match", async () => {
    await withdrawFailsDueToKeysDontMatch(treasuryMeta);
  });

  // it("Fails to withdraw due to treasury doesn't match", async () => {
  //   await withdrawFailsDueToTreasuryMismatch(treasuryMeta);
  // });

  // it("Fails to withdraw due to invalid coupon", async () => {
  //   await withdrawFailsDueToInvalidCoupon(treasuryMeta);
  // });

  // it("Fails to withdraw due to invalid signature", async () => {
  //   withdrawFailsDueToInvalidSignature(treasuryMeta);
  // });

  // it("Fails to withdraw due to invalid coupon hash", async () => {
  //   await withdrawFailsDueToInvalidCouponHash(treasuryMeta);
  // });

  // it("Fails to withdraw due to invalid signature pubkey", async () => {
  //   await withdrawFailsDueToInvalidSignaturePubkey(treasuryMeta);
  // });

  // it("Fails to withdraw due to invalid signature pda", async () => {
  //   await withdrawFailsDueToInvalidSignaturePda(treasuryMeta);
  // });

  // it("Fails to withdraw due to invalid signature pubkey and pda", async () => {
  //   await withdrawFailsDueToInvalidSignaturePubkeyAndPda(treasuryMeta);
  // });

  // it("Fails to withdraw due to invalid recovery id", async () => {
  //   await withdrawFailsDueToIncorrectRecoveryId(treasuryMeta);
  // });

  // it("Fails to withdraw due to invalid receiver", async () => {
  //   await withdrawFailsDueToReceiverMismatch(treasuryMeta);
  // });

  // it("Withdraws with valid signature and data", async () => {
  //   await withdrawWithValidSignatureAndData(treasuryMeta);
  // });

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

    const treasuryPubkey = new PublicKey(
      "FB4zo7Ldu2BuYxrHKy9WXjYDC5FcpnDMz9sGQRmLNQWg"
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
        "uomtd-iwqym-753el-2jqre-zylmb-vff5w-za3sy-ijgqf-alhqs-nxhuj-5ae",
      to_sol_address: "5mgy1anWRRbWCRGG26vsP8C3fQRDcXXer9Po3Vjjmyd5",
      amount: "20_000_000",
      burn_id: 1,
      burn_timestamp: "1730615672390087127",
      icp_burn_block_index: 0,
    };

    const couponHash =
      "0x" + "eb2b702cb0369dcedf1f01fd99c8daec051b0f16f49d795db7bc3bb0b883dafd";
    const sig =
      "0x" +
      "22b3690ab48a30256e4f015c7ab6d641eea22136904c561c3cebc2392dba069f6ed07b83fe3e770bb452f7dbab91a9eb8908bb08a81dbd1d81bfe6d0cc026f02";
    const recoveryId = 1;

    const bibiancoupon = {
      from_icp_address:
        "uomtd-iwqym-753el-2jqre-zylmb-vff5w-za3sy-ijgqf-alhqs-nxhuj-5ae",
      to_sol_address: "FMbpmdAnsCSPCj51hoSQxvwBJVb69cHDjT6Ch8wukJSj",
      amount: "10_000",
      burn_id: 3,
      burn_timestamp: "1730437140356983971",
      icp_burn_block_index: 4,
    };

    const bibiancouponHash =
      "0x" + "fa69ed41fee9890720627a72a70e02a0b1afd2207d3922fb367ac40ca4e6c6ca";
    const bibiancouponSig =
      "0x" +
      "ac13cd880020dc2dfebafcd1df0aba8c09ec5f107947e48b14ae8c7a55f7998f752c9aba06e573a3605ec165bd7890b94448cf0211a68d523fe9f009c948a1c2";

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
      treasuryPubkey
    );
    console.log("treasuryTokenAccount", treasuryTokenAccount.toString());

    const wrongTreasuryTokenAccount = getAssociatedTokenAddressSync(
      rewardTokenMintPda,
      new PublicKey("8nZLXraZUARNmU3P8PKbJMS7NYs7aEyw6d1aQx1km3t2")
    );

    console.log("treasuryKeypair", treasuryPubkey.toBase58());

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

    // create account 
    try {
      const txHash = await createAccount(
        connection,
        wallet.payer,
        rewardTokenMintPda,
        wallet.publicKey,
      );
      console.log("txHash", txHash);
    } catch (error) {
      console.log("error", error);
    }

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
      wrongTreasuryTokenAccount,
      bibiancoupon,
      bibiancouponHash,
      bibiancouponSig,
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
      uri: "https://3yxbhwntrxjgvuip2nrfc2l6v4l74wbngnuojj7z4zk2dikt6n4a.arweave.net/3i4T2bON0mrRD9NiUWl-rxf-WC0zaOSn-eZVoaFT83g/bton.json",
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
