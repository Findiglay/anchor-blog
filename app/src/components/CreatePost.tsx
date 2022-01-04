import * as anchor from "@project-serum/anchor";
import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import * as config from "../utils/config";

interface InitializeProps {
  blog: any;
  blogAccount: anchor.web3.PublicKey;
}

function CreatePost({ blog, blogAccount }: InitializeProps) {
  const [loading, setLoading] = useState(false);
  const wallet = useAnchorWallet();
  console.log("blog: ", blog);

  async function handlePublish() {
    setLoading(true);

    const provider = config.getProvider(wallet);
    const program = config.getProgram(provider);

    const title = "Hello World";
    const body = "This is a test post";

    try {
      const [postAccount, postAccountBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from("post"),
            blogAccount.toBuffer(),
            new anchor.BN(blog.postCount).toArrayLike(Buffer),
          ],
          program.programId
        );

      await program.rpc.createPost(postAccountBump, title, body, {
        accounts: {
          postAccount,
          blogAccount,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      });
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  return (
    <div>
      <h1>Create a new post</h1>
      <button disabled={loading} onClick={handlePublish}>
        {loading ? "Publishing..." : "Create"}
      </button>
    </div>
  );
}

export default CreatePost;
