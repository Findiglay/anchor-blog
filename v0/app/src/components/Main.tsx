import * as anchor from "@project-serum/anchor";
import { useAnchorWallet, AnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useMemo, useState } from "react";
import * as config from "../config";
import Initialize from "./Initialize";
import CreatePost from "./CreatePost";
import Posts from "./Posts";

function Main() {
  const wallet = useAnchorWallet();
  const [initialized, setInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [blog, setBlog] = useState<any>(null);
  const [blogAddress, setBlogAddress] = useState<{
    pda: anchor.web3.PublicKey;
    bump: number;
  } | null>(null);

  const provider = useMemo(() => {
    const connection = new anchor.web3.Connection(
      config.endpoint,
      config.preflightCommitment
    );
    // @ts-ignore
    return new anchor.Provider(connection, wallet, {
      preflightCommitment: config.preflightCommitment,
    });
  }, [wallet]);

  const program = useMemo(
    () =>
      new anchor.Program(config.idl as anchor.Idl, config.programID, provider),
    [provider]
  );

  async function fetchBlog(wallet: AnchorWallet) {
    setLoading(true);

    const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("blog_v0"), wallet.publicKey.toBuffer()],
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

  if (!wallet?.publicKey) {
    return (
      <div>
        <h3>Connect your wallet to get started</h3>
        <WalletMultiButton />
      </div>
    );
  }

  if (initialized && blogAddress) {
    return (
      <>
        <Posts blog={blog} blogAccount={blogAddress.pda} program={program} />
        <CreatePost
          blog={blog}
          blogAccount={blogAddress.pda}
          provider={provider}
          program={program}
          onCreate={() => {
            fetchBlog(wallet);
          }}
        />
      </>
    );
  }

  if (loading || !blogAddress) {
    return <div>loading...</div>;
  }

  return (
    <Initialize
      blogAccount={blogAddress?.pda.toString()}
      blogAccountBump={blogAddress?.bump}
      provider={provider}
      program={program}
      onInitialize={() => {
        fetchBlog(wallet);
      }}
    />
  );
}

export default Main;
