import * as anchor from "@project-serum/anchor";
import { useState } from "react";

interface CreatePostProps {
  blog: any;
  blogAccount: anchor.web3.PublicKey;
  program: anchor.Program;
  provider: anchor.Provider;
  onCreate: () => void;
}

function CreatePost({
  blog,
  blogAccount,
  program,
  provider,
  onCreate,
}: CreatePostProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function handlePublish() {
    setLoading(true);

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
      setTitle("");
      setBody("");
      onCreate();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h3>Create a new post</h3>
      <div>
        <label>
          Title:
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Body:
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
      </div>
      <button disabled={loading} onClick={handlePublish}>
        {loading ? "Publishing..." : "Create"}
      </button>
    </>
  );
}

export default CreatePost;
