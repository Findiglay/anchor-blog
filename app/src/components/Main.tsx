import * as anchor from "@project-serum/anchor";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import * as config from "../utils/config";
import Initialize from "./Initialize";
import CreatePost from "./CreatePost";

function Main() {
  const wallet = useWallet();
  const [initialized, setInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [blog, setBlog] = useState<any>(null);
  const [blogAddress, setBlogAddress] = useState<{
    pda: anchor.web3.PublicKey;
    bump: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (!wallet.publicKey) return;

      const provider = config.getProvider(wallet);
      const program = config.getProgram(provider);

      const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("blog"), wallet.publicKey.toBuffer()],
        config.programID
      );

      setBlogAddress({ pda, bump });

      const blog = await program.account.blog.fetch(pda);

      if (blog) {
        setBlog(blog);
        setInitialized(true);
      }

      setLoading(false);
    })();
  }, [wallet]);

  if (loading) {
    return <div>loading...</div>;
  }

  return (
    <div>
      {initialized ? (
        <CreatePost blog={blog} />
      ) : blogAddress ? (
        <Initialize
          blogAccount={blogAddress?.pda.toString()}
          blogAccountBump={blogAddress?.bump}
        />
      ) : null}
    </div>
  );
}

export default Main;
