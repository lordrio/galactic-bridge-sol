import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { SolanaTreasury } from "../../target/types/solana_treasury";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface DepositProps {
  connection: anchor.web3.Connection;
  program: anchor.Program<SolanaTreasury>;
  wallet: anchor.Wallet;
  treasuryPDA: anchor.web3.PublicKey;
}

export const deposit = async ({
  connection,
  program,
  wallet,
  playerTokenAccount,
  rewardTokenMintPda,
}: DepositProps) => {
  const data = {
    addressIcp:
      "pvmak-bbryo-hipdn-slp5u-fpsh5-tkf7f-v2wss-534um-jc454-ommhu-2qe",
    amount: "10",
  };
  const walletBalanceInitial = (await connection.getTokenAccountBalance(playerTokenAccount)).value.uiAmount;

  // Add listener for DepositEvent and check event details
  const listener = program.addEventListener(
    "depositEvent",
    (event, _context) => {
      assert.equal(
        event.addressIcp,
        data.addressIcp,
        "Deposited ICP address doesn't match expected address"
      );
      assert.equal(
        event.amount.toString(),
        data.amount,
        "Deposited amount doesn't match expected amount"
      );
      console.log("depositEvent", event);
      program.removeEventListener(listener);
    } 
  );

  const latestBlockHash = await connection.getLatestBlockhash();
  const methodBuilder = program.methods
    .deposit({
      addressIcp: data.addressIcp,
      amount: new anchor.BN(data.amount),
    })
    .accounts({
      payer: wallet.publicKey,
      payerTokenAccount: playerTokenAccount,
      btonTokenMint: rewardTokenMintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    });

  const tx = await methodBuilder.transaction();
  tx.recentBlockhash = latestBlockHash.blockhash;
  tx.feePayer = wallet.publicKey;
  const fee = await tx.getEstimatedFee(connection);

  await methodBuilder.rpc();

  let walletBalance = (await connection.getTokenAccountBalance(playerTokenAccount)).value.uiAmount;
  const walletBalanceAfter = walletBalanceInitial - walletBalance;

  console.log("walletBalanceInitial", walletBalanceInitial);
  console.log("walletBalance", walletBalance);
  console.log("walletBalanceAfter", walletBalanceAfter);
};
