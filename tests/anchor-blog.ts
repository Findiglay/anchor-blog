import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { AnchorBlog } from "../target/types/anchor_blog";

describe("anchor-blog", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  // @ts-expect-error
  const program = anchor.workspace.AnchorBlog as Program<AnchorBlog>;

  it("Is initialized!", async () => {
    const [blogAccount, blogAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("blog")],
        program.programId
      );
    // Add your test here.
    const tx = await program.rpc.initialize(blogAccountBump, {
      accounts: {
        blogAccount,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });
    console.log("Your transaction signature", tx);

    const currentBlogAccountState = await program.account.blog.fetch(
      blogAccount
    );

    console.log("currentBlogAccountState: ", currentBlogAccountState);

    const [postAccount, postAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("post"),
          blogAccount.toBuffer(),
          new anchor.BN(currentBlogAccountState.postCount).toBuffer(),
        ],
        program.programId
      );
    console.log("postAccount: ", postAccount);
    console.log("postAccountBump: ", postAccountBump);
    const title = "Hello World";
    const body = "This is a test post";

    const postTnx = await program.rpc.createPost(postAccountBump, title, body, {
      accounts: {
        blogAccount,
        postAccount,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    console.log("Your transaction signature", postTnx);

    const currentPostAccountState = await program.account.post.fetch(
      postAccount
    );
    console.log("Current post account state", currentPostAccountState);
  });
});
