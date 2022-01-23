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
      [Buffer.from("blog"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

  const [firstPostAccount, firstPostAccountBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("post"),
        blogAccount.toBuffer(),
        new anchor.BN(0).toArrayLike(Buffer, "le", 4),
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
        updateAuthority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    const blogState = await program.account.blog.fetch(blogAccount);

    assert.equal(0, blogState.postCount);
  });

  it("Creates a post and increments the post count", async () => {
    const metadata = {
      title: "Hello World",
      description: "gm, this is a test post",
      uri: "https://ipfs.io/ipfs/somehash",
    };

    await program.rpc.createPost(firstPostAccountBump, metadata, {
      accounts: {
        blogAccount,
        postAccount: firstPostAccount,
        updateAuthority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    const blogState = await program.account.blog.fetch(blogAccount);
    const postState = await program.account.post.fetch(firstPostAccount);

    assert.equal(metadata.title, postState.data.title);
    assert.equal(metadata.description, postState.data.description);
    assert.equal(0, postState.entry);
    assert.equal(1, blogState.postCount);
  });

  it("Requires the correct signer to create a post", async () => {
    const metadata = {
      title: "Hello World",
      description: "gm, this is an unauthorized post",
      uri: "https://ipfs.io/ipfs/somehash",
    };

    const [secondPostAccount, secondPostAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("post"),
          blogAccount.toBuffer(),
          new anchor.BN(1).toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );
    const newKeypair = anchor.web3.Keypair.generate();
    await helpers.requestAirdrop(connection, newKeypair.publicKey);
    const newProvider = helpers.getProvider(connection, newKeypair);
    const newProgram = helpers.getProgram(newProvider);

    let error;

    try {
      await newProgram.rpc.createPost(secondPostAccountBump, metadata, {
        accounts: {
          blogAccount,
          postAccount: secondPostAccount,
          updateAuthority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
      });
    } catch (err) {
      error = err;
    } finally {
      assert.equal(error.message, "Signature verification failed");
    }
  });

  it("Updates a post", async () => {
    const metadata = {
      title: "Hello World Update",
      description: "gm, this post has been updated",
      uri: "https://ipfs.io/ipfs/somehash",
    };

    await program.rpc.updatePost(metadata, {
      accounts: {
        postAccount: firstPostAccount,
        updateAuthority: provider.wallet.publicKey,
      },
    });

    const blogState = await program.account.blog.fetch(blogAccount);
    const postState = await program.account.post.fetch(firstPostAccount);

    assert.equal(1, blogState.postCount);
    assert.equal(metadata.title, postState.data.title);
    assert.equal(metadata.description, postState.data.description);
  });

  it("Requires the correct signer to update a post", async () => {
    const metadata = {
      title: "Hello World Update",
      description: "gm, this post has been updated",
      uri: "https://ipfs.io/ipfs/somehash",
    };

    const newKeypair = anchor.web3.Keypair.generate();
    await helpers.requestAirdrop(connection, newKeypair.publicKey);
    const newProvider = helpers.getProvider(connection, newKeypair);
    const newProgram = helpers.getProgram(newProvider);

    let error;

    try {
      await newProgram.rpc.updatePost(metadata, {
        accounts: {
          postAccount: firstPostAccount,
          updateAuthority: provider.wallet.publicKey,
        },
      });
    } catch (err) {
      error = err;
    } finally {
      assert.equal(error?.message, "Signature verification failed");
    }
  });

  it("Will not allow updating another blog's post", async () => {
    const metadata = {
      title: "Hello World Update",
      description: "gm, this post has been updated",
      uri: "https://ipfs.io/ipfs/somehash",
    };

    const newKeypair = anchor.web3.Keypair.generate();
    await helpers.requestAirdrop(connection, newKeypair.publicKey);
    const newProvider = helpers.getProvider(connection, newKeypair);
    const newProgram = helpers.getProgram(newProvider);

    const [newBlogAccount, newBlogAccountBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("blog"), newKeypair.publicKey.toBuffer()],
        program.programId
      );
    // Initialize person B's blog
    await newProgram.rpc.initialize(newBlogAccountBump, {
      accounts: {
        blogAccount: newBlogAccount,
        updateAuthority: newKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    let error;

    try {
      await newProgram.rpc.updatePost(metadata, {
        accounts: {
          postAccount: firstPostAccount,
          updateAuthority: newKeypair.publicKey,
        },
      });
    } catch (err) {
      error = err;
    } finally {
      assert(error?.message.includes("has_one constraint was violated"));
    }
  });
});
