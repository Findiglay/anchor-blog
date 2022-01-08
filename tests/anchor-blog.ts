import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { AnchorBlog } from "../target/types/anchor_blog";

describe("anchor-blog", async () => {
  // Configure the client to use the local cluster.
  const connection = new anchor.web3.Connection(
    "http://localhost:8899",
    anchor.Provider.defaultOptions().preflightCommitment
  );

  const provider = getProvider(connection, anchor.web3.Keypair.generate());
  const program = getProgram(provider);

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

  const [secondPostAccount, secondPostAccountBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("post"),
        blogAccount.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer),
      ],
      program.programId
    );

  before(async () => {
    await requestAirdrop(connection, provider.wallet.publicKey);
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

    assert.equal(1, blogState.postCount);
    assert.equal(title, postState.title);
    assert.equal(body, postState.body);
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

    try {
      const newKeypair = anchor.web3.Keypair.generate();
      await requestAirdrop(connection, newKeypair.publicKey);
      const newProvider = getProvider(connection, newKeypair);
      const newProgram = getProgram(newProvider);

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
      await requestAirdrop(connection, newKeypair.publicKey);
      const newProvider = getProvider(connection, newKeypair);
      const newProgram = getProgram(newProvider);

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

  it("Requires post to be created in incremental order", async () => {
    const [tenthPostAccount, tenthPostAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("post"),
          blogAccount.toBuffer(),
          new anchor.BN(9).toArrayLike(Buffer),
        ],
        program.programId
      );

    const title = "Hello World for the 10th Time";
    const body = "gm, this post won't be created";

    let error;

    try {
      await program.rpc.createPost(tenthPostAccountBump, title, body, {
        accounts: {
          blogAccount,
          postAccount: tenthPostAccount,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      });
    } catch (err) {
      error = err;
    } finally {
      assert.equal(
        error.message,
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: Program failed to complete"
      );
    }
  });
});

function getProgram(provider: anchor.Provider): Program<AnchorBlog> {
  const idl = require("../target/idl/anchor_blog.json");
  const programID = new anchor.web3.PublicKey(idl.metadata.address);
  return new anchor.Program(idl, programID, provider);
}

function getProvider(
  connection: anchor.web3.Connection,
  keypair: anchor.web3.Keypair
): anchor.Provider {
  // @ts-expect-error
  const wallet = new anchor.Wallet(keypair);
  return new anchor.Provider(
    connection,
    wallet,
    anchor.Provider.defaultOptions()
  );
}

async function requestAirdrop(
  connection: anchor.web3.Connection,
  publicKey: anchor.web3.PublicKey
) {
  const airdropSignature = await connection.requestAirdrop(
    publicKey,
    anchor.web3.LAMPORTS_PER_SOL * 20
  );
  await connection.confirmTransaction(airdropSignature);
}
