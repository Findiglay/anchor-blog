import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { AnchorBlog } from "../target/types/anchor_blog";

describe("anchor-blog", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  // @ts-expect-error
  const program = anchor.workspace.AnchorBlog as Program<AnchorBlog>;

  it("Creates a post", async () => {
    const [blogAccount, blogAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("blog"), provider.wallet.publicKey.toBuffer()],
        program.programId
      );

    await program.rpc.initialize(blogAccountBump, {
      accounts: {
        blogAccount,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    const currentBlogAccountState = await program.account.blog.fetch(
      blogAccount
    );

    const [postAccount, postAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("post"),
          blogAccount.toBuffer(),
          new anchor.BN(currentBlogAccountState.postCount).toBuffer(),
        ],
        program.programId
      );

    const title = "Hello World";
    const body = "This is a test post";

    await program.rpc.createPost(postAccountBump, title, body, {
      accounts: {
        blogAccount,
        postAccount,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    const currentPostAccountState = await program.account.post.fetch(
      postAccount
    );
    console.log("Current post account state", currentPostAccountState);
  });
});
