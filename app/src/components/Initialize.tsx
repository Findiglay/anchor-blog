import * as anchor from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import * as config from "../utils/config";

interface InitializeProps {
  blogAccount: string;
  blogAccountBump: number;
}

function Initialize({ blogAccount, blogAccountBump }: InitializeProps) {
  const wallet = useWallet();

  async function handleInit() {
    const provider = config.getProvider(wallet);
    const program = config.getProgram(provider);

    try {
      await program.rpc.initialize(blogAccountBump, {
        accounts: {
          blogAccount,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      <h1>Initialize your blog</h1>
      <button onClick={handleInit}>Initialize</button>
    </div>
  );
}

export default Initialize;
