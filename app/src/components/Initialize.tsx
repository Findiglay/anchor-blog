import * as anchor from "@project-serum/anchor";
import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import * as config from "../utils/config";

interface InitializeProps {
  blogAccount: string;
  blogAccountBump: number;
  onInitialize: () => void;
}

function Initialize({
  blogAccount,
  blogAccountBump,
  onInitialize,
}: InitializeProps) {
  const [loading, setLoading] = useState(false);
  const wallet = useAnchorWallet();

  async function handleInit() {
    setLoading(true);

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
      onInitialize();
    } catch (error) {
      setLoading(false);
      console.log(error);
    } finally {
    }
  }

  return (
    <div>
      <h1>Initialize your blog</h1>
      <button disabled={loading} onClick={handleInit}>
        {loading ? "Initializing..." : "Initialize"}
      </button>
    </div>
  );
}

export default Initialize;
