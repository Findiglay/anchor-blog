import * as anchor from "@project-serum/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

interface PostsProps {
  blog: any;
  blogAccount: anchor.web3.PublicKey;
  program: anchor.Program;
}

function Posts({ blog, blogAccount, program }: PostsProps) {
  const wallet = useAnchorWallet();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        console.log("fetching posts...");
        const promises = Array.from(Array(blog.postCount)).map(async (_, i) => {
          const [postAccount] = await anchor.web3.PublicKey.findProgramAddress(
            [
              Buffer.from("post"),
              blogAccount.toBuffer(),
              new anchor.BN(i).toArrayLike(Buffer),
            ],
            program.programId
          );

          const post = await program.account.post.fetch(postAccount);

          return {
            ...post,
            key: postAccount.toBase58(),
          };
        });

        const posts = await Promise.all(promises);

        setPosts(posts);
      } catch (error) {
        console.log(error);
      }
    }

    fetchPosts();
  }, [blog, blogAccount, program, wallet]);

  return (
    <div>
      <h2>Posts</h2>
      {posts.map((post) => (
        <div key={post.key}>
          <h5>{post?.title}</h5>
          <p>{post?.body}</p>
        </div>
      ))}
    </div>
  );
}

export default Posts;
