import assert from "assert";
import * as anchor from "@project-serum/anchor";
import * as helpers from "./helpers";

describe("anchor-blog", async () => {
  // Configure the client to use the local cluster.
  const connection = new anchor.web3.Connection(
    "http://localhost:8899",
    anchor.Provider.defaultOptions().preflightCommitment
  );

  const provider = helpers.getProvider(
    connection,
    anchor.web3.Keypair.generate()
  );
  const program = helpers.getProgram(provider);

  const [blogAccount, blogAccountBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("blog_v0"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

  const [firstPostAccount, firstPostAccountBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("post"),
        blogAccount.toBuffer(),
        new anchor.BN(0).toArrayLike(Buffer),
      ],
      program.programId
    );

  before(async () => {
    await helpers.requestAirdrop(connection, provider.wallet.publicKey);
  });

  it("Initializes with 0 entries", async () => {
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

  it("Creates a post and increments the post count", async () => {
    const title = "Hello World";
    const body = "gm, this is a test post";

    await program.rpc.createPost(firstPostAccountBump, title, body, {
      accounts: {
        blogAccount,
        postAccount: firstPostAccount,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    const blogState = await program.account.blog.fetch(blogAccount);
    const postState = await program.account.post.fetch(firstPostAccount);

    assert.equal(title, postState.title);
    assert.equal(body, postState.body);
    assert.equal(0, postState.entry);
    assert.equal(1, blogState.postCount);
  });

  it("Updates a post", async () => {
    const title = "Hello World Update";
    const body = "gm, this post has been updated";

    await program.rpc.updatePost(title, body, {
      accounts: {
        blogAccount,
        postAccount: firstPostAccount,
        authority: provider.wallet.publicKey,
      },
    });

    const blogState = await program.account.blog.fetch(blogAccount);
    const postState = await program.account.post.fetch(firstPostAccount);

    assert.equal(1, blogState.postCount);
    assert.equal(title, postState.title);
    assert.equal(body, postState.body);
  });

  it("Requires correct authority to create a post", async () => {
    const title = "Hello World";
    const body = "gm, this is an unauthorized post";

    let error;

    const [secondPostAccount, secondPostAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("post"),
          blogAccount.toBuffer(),
          new anchor.BN(1).toArrayLike(Buffer),
        ],
        program.programId
      );

    try {
      const newKeypair = anchor.web3.Keypair.generate();
      await helpers.requestAirdrop(connection, newKeypair.publicKey);
      const newProvider = helpers.getProvider(connection, newKeypair);
      const newProgram = helpers.getProgram(newProvider);

      await newProgram.rpc.createPost(secondPostAccountBump, title, body, {
        accounts: {
          blogAccount,
          postAccount: secondPostAccount,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      });
    } catch (err) {
      error = err;
    } finally {
      assert.equal(error.message, "Signature verification failed");
    }
  });

  it("Requires correct authority to update a post", async () => {
    const title = "Hello World Update";
    const body = "gm, this post has been updated";

    let error;

    try {
      const newKeypair = anchor.web3.Keypair.generate();
      await helpers.requestAirdrop(connection, newKeypair.publicKey);
      const newProvider = helpers.getProvider(connection, newKeypair);
      const newProgram = helpers.getProgram(newProvider);

      await newProgram.rpc.updatePost(title, body, {
        accounts: {
          blogAccount,
          postAccount: firstPostAccount,
          authority: provider.wallet.publicKey,
        },
      });
    } catch (err) {
      error = err;
    } finally {
      assert.equal(error.message, "Signature verification failed");
    }
  });
});
