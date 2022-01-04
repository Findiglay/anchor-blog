import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { AnchorBlog } from "../target/types/anchor_blog";

describe("anchor-blog", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  // @ts-expect-error
  const program = anchor.workspace.AnchorBlog as Program<AnchorBlog>;

  it("Initializes with 0 entries", async () => {
    const [blogAccount, blogAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("blog_v0"), provider.wallet.publicKey.toBuffer()],
        program.programId
      );

    await program.rpc.initialize(blogAccountBump, {
      accounts: {
        blogAccount,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    const blogState = await program.account.blog.fetch(blogAccount);

    assert.equal(0, blogState.postCount);
  });

  it("Creates a post and correctly increments the post count", async () => {
    const [blogAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("blog_v0"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const [postAccount, postAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("post"),
          blogAccount.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer),
        ],
        program.programId
      );

    const title = "Hello World";
    const body = "gm, this is a test post";

    await program.rpc.createPost(postAccountBump, title, body, {
      accounts: {
        blogAccount,
        postAccount,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    const blogState = await program.account.blog.fetch(blogAccount);
    const postState = await program.account.post.fetch(postAccount);

    assert.equal(1, blogState.postCount);
    assert.equal("Hello World", postState.title);
    assert.equal("gm, this is a test post", postState.body);
  });
});
