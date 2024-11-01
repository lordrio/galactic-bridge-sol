import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { ethers } from "ethers";
import * as crypto from "crypto";

export const withdrawFailsDueToInvalidCoupon = async ({
  program,
  coupon,
  sig,
  couponHash,
  recoveryId,
  wallet,
  receiverPubkey,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
  const couponScam = {
    ...coupon,
    amount: "99_999_999",
  };

  try {
    await program.methods
      .withdraw({
        message: Buffer.from(ethers.toBeArray(couponHash)),
        signature: Buffer.from(ethers.toBeArray(sig)).toJSON().data,
        coupon: {
          fromIcpAddress: couponScam.from_icp_address,
          toSolAddress: couponScam.to_sol_address,
          amount: couponScam.amount,
          burnId: new anchor.BN(couponScam.burn_id),
          burnTimestamp: couponScam.burn_timestamp,
          icpBurnBlockIndex: new anchor.BN(couponScam.icp_burn_block_index),
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
    // No assertion here, as an error is expected
  } catch (error) {
    console.log("error", error);
    const code = error.error.errorCode.code;

    assert(
      code === "InvalidCouponHash",
      `Expected error with code 'InvalidCouponHash' but got '${code}'`
    );
    return;
  }
  assert(false, "Expected to error out with InvalidCouponHash");
};

export const withdrawFailsDueToTreasuryMismatch = async ({
  program,
  recoveryId,
  wallet,
  receiverPubkey,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  rewardTokenMintPda,
  bibiancoupon,
  bibiancouponHash,
  bibiancouponSig,
}) => {
  const couponScam = {
    ...bibiancoupon,
  };

  try {
    await program.methods
      .withdraw({
        message: Buffer.from(ethers.toBeArray(bibiancouponHash)),
        signature: Buffer.from(ethers.toBeArray(bibiancouponSig)).toJSON().data,
        coupon: {
          fromIcpAddress: couponScam.from_icp_address,
          toSolAddress: couponScam.to_sol_address,
          amount: couponScam.amount,
          burnId: new anchor.BN(couponScam.burn_id),
          burnTimestamp: couponScam.burn_timestamp,
          icpBurnBlockIndex: new anchor.BN(couponScam.icp_burn_block_index),
        },
        recoveryId: recoveryId,
      })
      .accounts({
        payer: wallet.publicKey,
        receiver: receiverPubkey,
        hashedSignaturePubkey: hashedSignaturePubkey,
        signaturePda: signaturePda,
        payerTokenAccount: playerTokenAccount,
        treasuryTokenAccount: playerTokenAccount,
        btonTokenMint: rewardTokenMintPda,
      })
      .rpc();
    // No assertion here, as an error is expected
  } catch (error) {
    console.log("error", error);
    const code = error.error.errorCode.code;

    assert(
      code === "ConstraintAddress",
      `Expected error with code 'ConstraintAddress' but got '${code}'`
    );
    return;
  }
  assert(false, "Expected to error out with ConstraintAddress");
};


export const withdrawFailsDueToKeysDontMatch = async ({
  program,
  recoveryId,
  wallet,
  receiverPubkey,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
  bibiancoupon,
  bibiancouponHash,
  bibiancouponSig,
}) => {
  const couponScam = {
    ...bibiancoupon,
  };

  try {
    await program.methods
      .withdraw({
        message: Buffer.from(ethers.toBeArray(bibiancouponHash)),
        signature: Buffer.from(ethers.toBeArray(bibiancouponSig)).toJSON().data,
        coupon: {
          fromIcpAddress: couponScam.from_icp_address,
          toSolAddress: couponScam.to_sol_address,
          amount: couponScam.amount,
          burnId: new anchor.BN(couponScam.burn_id),
          burnTimestamp: couponScam.burn_timestamp,
          icpBurnBlockIndex: new anchor.BN(couponScam.icp_burn_block_index),
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
    // No assertion here, as an error is expected
  } catch (error) {
    console.log("error", error);
    const code = error.error.errorCode.code;

    assert(
      code === "KeysDontMatch",
      `Expected error with code 'KeysDontMatch' but got '${code}'`
    );
    return;
  }
  assert(false, "Expected to error out with KeysDontMatch");
};

export const withdrawFailsDueToInvalidSignature = async ({
  program,
  couponHash,
  coupon,
  recoveryId,
  wallet,
  receiverPubkey,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
  const sigScam =
    "0x" +
    "fff722f41eb1cae151458c2d9acf16695984d1376a6a0a6ab56a385204f889370aec600906f278c5d9522d1df16ab50940827f96d7f62f61cd2ba33b28f2b7df";
  try {
    await program.methods
      .withdraw({
        message: Buffer.from(ethers.toBeArray(couponHash)),
        signature: Buffer.from(ethers.toBeArray(sigScam)).toJSON().data,
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
  } catch (error) {
    assert(
      error.error.errorCode.code === "InvalidSignature",
      `Expected error with code 'InvalidSignature' but got '${error.error.errorCode.code}'`
    );
    return;
  }
  assert(false, "Expected to error out with InvalidSignature");
};

export const withdrawFailsDueToInvalidCouponHash = async ({
  program,
  sig,
  coupon,
  recoveryId,
  wallet,
  receiverPubkey,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
  const scamCouponHash =
    "0x" + "01a9dd358a821b90a0523cbbb3b2ad3fbd8be75e09b132c5c129b65589774c9d";
  try {
    await program.methods
      .withdraw({
        message: Buffer.from(ethers.toBeArray(scamCouponHash)),
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
  } catch (error) {
    assert(
      error.error.errorCode.code === "InvalidCouponHash",
      `Expected error with code 'InvalidCouponHash' but got '${error.error.errorCode.code}'`
    );

    return;
  }
  assert(false, "Expected to error out with InvalidCouponHash");
};

export const withdrawFailsDueToInvalidSignaturePubkey = async ({
  program,
  couponHash,
  sig,
  coupon,
  recoveryId,
  wallet,
  receiverPubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
  const sigScam =
    "0x" +
    "fff722f41eb1cae151458c2d9acf16695984d1376a6a0a6ab56a385204f889370aec600906f278c5d9522d1df16ab50940827f96d7f62f61cd2ba33b28f2b7df";
  const sigHashedScam = crypto
    .createHash("sha256")
    .update(ethers.toBeArray(sigScam))
    .digest();
  const sigHashedBytesScam = sigHashedScam.toJSON().data;
  const hashedSignaturePubkeyScam = new anchor.web3.PublicKey(
    sigHashedBytesScam
  );
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
        hashedSignaturePubkey: hashedSignaturePubkeyScam,
        signaturePda: signaturePda,
        payerTokenAccount: playerTokenAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        btonTokenMint: rewardTokenMintPda,
      })
      .rpc();
  } catch (error) {
    const code = error.error.errorCode.code;

    assert(
      code === "ConstraintSeeds",
      `Expected error with code 'ConstraintSeeds' but got '${code}'`
    );
    return;
  }

  assert(false, "Expected to error out with ConstraintSeeds");
};

export const withdrawFailsDueToInvalidSignaturePda = async ({
  program,
  couponHash,
  sig,
  coupon,
  recoveryId,
  wallet,
  receiverPubkey,
  hashedSignaturePubkey,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
  try {
    const sigScam =
      "0x" +
      "fff722f41eb1cae151458c2d9acf16695984d1376a6a0a6ab56a385204f889370aec600906f278c5d9522d1df16ab50940827f96d7f62f61cd2ba33b28f2b7df";
    const sigHashedScam = crypto
      .createHash("sha256")
      .update(ethers.toBeArray(sigScam))
      .digest();
    const sigHashedBytesScam = sigHashedScam.toJSON().data;
    const hashedSignaturePubkeyScam = new anchor.web3.PublicKey(
      sigHashedBytesScam
    );
    const [signaturePdaScam] = anchor.web3.PublicKey.findProgramAddressSync(
      [hashedSignaturePubkeyScam.toBuffer()],
      program.programId
    );

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
        signaturePda: signaturePdaScam,
        payerTokenAccount: playerTokenAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        btonTokenMint: rewardTokenMintPda,
      })
      .rpc();
  } catch (error) {
    const code = error.error.errorCode.code;

    assert(
      code === "ConstraintSeeds",
      `Expected error with code 'ConstraintSeeds' but got '${code}'`
    );
    return;
  }

  assert(false, "Expected to error out with ConstraintSeeds");
};

export const withdrawFailsDueToInvalidSignaturePubkeyAndPda = async ({
  program,
  couponHash,
  sig,
  coupon,
  recoveryId,
  wallet,
  receiverPubkey,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
  const sigScam =
    "0x" +
    "fff722f41eb1cae151458c2d9acf16695984d1376a6a0a6ab56a385204f889370aec600906f278c5d9522d1df16ab50940827f96d7f62f61cd2ba33b28f2b7df";
  const sigHashedScam = crypto
    .createHash("sha256")
    .update(ethers.toBeArray(sigScam))
    .digest();
  const sigHashedBytesScam = sigHashedScam.toJSON().data;
  const hashedSignaturePubkeyScam = new anchor.web3.PublicKey(
    sigHashedBytesScam
  );
  const [signaturePdaScam] = anchor.web3.PublicKey.findProgramAddressSync(
    [hashedSignaturePubkeyScam.toBuffer()],
    program.programId
  );
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
        hashedSignaturePubkey: hashedSignaturePubkeyScam,
        signaturePda: signaturePdaScam,
        payerTokenAccount: playerTokenAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        btonTokenMint: rewardTokenMintPda,
      })
      .rpc();
  } catch (error) {
    const code = error.error.errorCode.code;

    assert(
      code === "KeysDontMatch",
      `Expected error with code 'KeysDontMatch' but got '${code}'`
    );
    return;
  }

  assert(false, "Expected to error out with KeysDontMatch");
};

export const withdrawFailsDueToIncorrectRecoveryId = async ({
  program,
  couponHash,
  sig,
  coupon,
  wallet,
  receiverPubkey,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
  const recoveryId = 1;
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
  } catch (error) {
    const code = error.error.errorCode.code;

    assert(
      code === "InvalidSignature",
      `Expected error with code 'InvalidSignature' but got '${code}'`
    );
    return;
  }

  assert(false, "Expected to error out with InvalidSignature");
};

export const withdrawFailsDueToReceiverMismatch = async ({
  program,
  couponHash,
  sig,
  coupon,
  recoveryId,
  wallet,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
  treasuryPDA,
}) => {
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
        receiver: treasuryPDA,
        hashedSignaturePubkey: hashedSignaturePubkey,
        signaturePda: signaturePda,
        payerTokenAccount: playerTokenAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        btonTokenMint: rewardTokenMintPda,
      })
      .rpc();
  } catch (error) {
    const code = error.error.errorCode.code;

    assert(
      code === "ReceiverMismatch",
      `Expected error with code 'ReceiverMismatch' but got '${code}'`
    );
    return;
  }

  assert(false, "Expected to error out with ReceiverMismatch");
};

export const withdrawFailsDueToUsedSignature = async ({
  program,
  couponHash,
  sig,
  coupon,
  recoveryId,
  wallet,
  receiverPubkey,
  hashedSignaturePubkey,
  signaturePda,
  playerTokenAccount,
  treasuryTokenAccount,
  rewardTokenMintPda,
}) => {
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
  } catch (error) {
    const code = error.error.errorCode.code;

    assert(
      code === "SignatureUsed",
      `Expected error with code 'SignatureUsed' but got '${code}'`
    );
    return;
  }

  assert(false, "Expected to error out with SignatureUsed");
};
