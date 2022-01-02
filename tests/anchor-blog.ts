import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { AnchorBlog } from "../target/types/anchor_blog";
import { Post } from "../target/types/post";

describe("anchor-blog", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  // @ts-expect-error
  const anchorBlog = anchor.workspace.AnchorBlog as Program<AnchorBlog>;
  // @ts-expect-error
  const post = anchor.workspace.Post as Program<Post>;

  let blogAccount, blogAccountBump;
  before(async () => {
    [blogAccount, blogAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("blog_account")],
        anchorBlog.programId
      );

    console.log(`blogAccount: ${blogAccount}`);
    console.log(`blogAccountBump: ${blogAccountBump}`);
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await anchorBlog.rpc.initialize(blogAccountBump, {
      accounts: {
        blogAccount,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });
    console.log("Your transaction signature", tx);
  });
});
