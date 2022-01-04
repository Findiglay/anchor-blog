import * as anchor from "@project-serum/anchor";
import { useEffect, useState } from "react";
import { useAnchorWallet, AnchorWallet } from "@solana/wallet-adapter-react";
import * as config from "../utils/config";
import Initialize from "./Initialize";
import CreatePost from "./CreatePost";

function Main() {
  const wallet = useAnchorWallet();
  const [initialized, setInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [blog, setBlog] = useState<any>(null);
  const [blogAddress, setBlogAddress] = useState<{
    pda: anchor.web3.PublicKey;
    bump: number;
  } | null>(null);

  async function fetchBlog(wallet: AnchorWallet) {
    setLoading(true);

    const provider = config.getProvider(wallet);
    const program = config.getProgram(provider);

    const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("blog"), wallet.publicKey.toBuffer()],
      config.programID
    );
    setBlogAddress({ pda, bump });

    try {
      const blog = await program.account.blog.fetch(pda);
      setBlog(blog);
      setInitialized(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (wallet?.publicKey) {
      fetchBlog(wallet);
    }
  }, [wallet]);

  if (loading) {
    return <div>loading...</div>;
  }

  if (initialized) {
    return <CreatePost blog={blog} />;
  }

  return blogAddress ? (
    <Initialize
      blogAccount={blogAddress?.pda.toString()}
      blogAccountBump={blogAddress?.bump}
      onInitialize={() => {
        if (wallet?.publicKey) {
          fetchBlog(wallet);
        }
      }}
    />
  ) : null;
}

export default Main;
