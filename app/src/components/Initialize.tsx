import * as anchor from "@project-serum/anchor";
import { useState } from "react";

interface InitializeProps {
  blogAccount: string;
  blogAccountBump: number;
  program: anchor.Program;
  provider: anchor.Provider;
  onInitialize: () => void;
}

function Initialize({
  blogAccount,
  blogAccountBump,
  program,
  provider,
  onInitialize,
}: InitializeProps) {
  const [loading, setLoading] = useState(false);

  async function handleInit() {
    setLoading(true);

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
    }
  }

  return (
    <div>
      <h3>Initialize your blog</h3>
      <button disabled={loading} onClick={handleInit}>
        {loading ? "Initializing..." : "Initialize"}
      </button>
    </div>
  );
}

export default Initialize;
