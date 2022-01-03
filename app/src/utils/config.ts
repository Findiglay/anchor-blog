import * as anchor from "@project-serum/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import idl from "../idl.json";

export const preflightCommitment = "processed";
export const programID = new anchor.web3.PublicKey(idl.metadata.address);
export const wallets = [new PhantomWalletAdapter()];

// mainnet-beta
// http://127.0.0.1:8899
export const endpoint = anchor.web3.clusterApiUrl(WalletAdapterNetwork.Devnet);

export function getProvider(wallet: any) {
  const connection = new anchor.web3.Connection(endpoint, preflightCommitment);
  return new anchor.Provider(connection, wallet, {
    preflightCommitment,
  });
}

export function getProgram(provider: anchor.Provider) {
  return new anchor.Program(idl as anchor.Idl, programID, provider);
}
