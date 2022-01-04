import * as anchor from "@project-serum/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import idl from "./idl.json";

export const preflightCommitment = "processed";
export const programID = new anchor.web3.PublicKey(idl.metadata.address);
export const wallets = [new PhantomWalletAdapter()];
export const endpoint = anchor.web3.clusterApiUrl(WalletAdapterNetwork.Devnet);
export { idl };
