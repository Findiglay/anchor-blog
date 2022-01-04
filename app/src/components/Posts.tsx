import * as anchor from "@project-serum/anchor";
import { useEffect, useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import * as config from "../utils/config";

interface PostsProps {
  blog: any;
  blogAccount: anchor.web3.PublicKey;
}

function Posts({ blog, blogAccount }: PostsProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const wallet = useAnchorWallet();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const provider = config.getProvider(wallet);
        const program = config.getProgram(provider);

        const promises = Array.from(Array(blog.postCount)).map(async (_, i) => {
          const [postAccount] = await anchor.web3.PublicKey.findProgramAddress(
            [
              Buffer.from("post"),
              blogAccount.toBuffer(),
              new anchor.BN(i).toArrayLike(Buffer),
            ],
            program.programId
          );

          return program.account.post.fetch(postAccount);
        });

        const posts = await Promise.all(promises);

        setPosts(posts);
      } catch (error) {
        console.log(error);
      }
    }

    fetchPosts();
  }, [blog, blogAccount, wallet]);

  return (
    <div>
      <h1>Posts</h1>
      {posts.map((post, i) => (
        <div key={i}>
          <h3>{post?.title}</h3>
          <p>{post?.body}</p>
        </div>
      ))}
    </div>
  );
}

export default Posts;
