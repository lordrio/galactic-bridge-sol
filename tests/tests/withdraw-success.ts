import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { ethers } from "ethers";

export const withdrawWithValidSignatureAndData = async ({
  program,
  couponHash,
  sig,
  coupon,
  recoveryId,
  wallet,
  receiverPubkey,
  treasuryPDA,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
  const treasuryInfoInitial = await program.provider.connection.getAccountInfo(
    treasuryPDA
  );
  let payerTokenAccountInitial = 0;
  try {
    payerTokenAccountInitial = (await program.provider.connection.getTokenAccountBalance(
      playerTokenAccount
    )).value.uiAmount;
  } catch (error) {
    console.log("error", error);
  };

  console.log("payerTokenAccountInitial", payerTokenAccountInitial);
  console.log("playerTokenAccount", playerTokenAccount.toBase58());
  try {
    await program.methods
      .withdraw({
        message: Buffer.from(ethers.toBeArray(couponHash)),
        signature: Buffer.from(ethers.toBeArray(sig)).toJSON().data,
        coupon: {
          fromIcpAddress: coupon.from_icp_address,
          toSolAddress: coupon.to_sol_address,
          amount: coupon.amount,
          burnId: new anchor.BN(coupon.burn_id),
          burnTimestamp: coupon.burn_timestamp,
          icpBurnBlockIndex: new anchor.BN(coupon.icp_burn_block_index),
        },
        recoveryId: recoveryId,
      })
      .accounts({
        payer: wallet.publicKey,
        receiver: receiverPubkey,
        hashedSignaturePubkey: hashedSignaturePubkey,
        signaturePda: signaturePda,
        payerTokenAccount: playerTokenAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        btonTokenMint: rewardTokenMintPda,
      })
      .rpc();

    let payerTokenAccountAfter = 0;
    try {
      payerTokenAccountAfter = await program.provider.connection.getTokenAccountBalance(
          playerTokenAccount
        ).value.uiAmount;
    } catch (error) {
      console.log("error", error);
    }

    console.log(
      "payerTokenAccountAfter",
      payerTokenAccountAfter - payerTokenAccountInitial
    );
  } catch (error) {
    assert(
      false,
      `Expected successful withdrawal but got an error: ${error.message}`
    );
  }
};
