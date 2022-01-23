use anchor_lang::prelude::*;

declare_id!("9PDAEyiU5GXhb3kJoGyasqT7tX2KxfE8Dpk7fY2c2WTY");

// Prefix used in PDA derivations to avoid collisions.
const POST_PREFIX: &str = "post";
const BLOG_PREFIX: &str = "blog";
const FOLLOW_PREFIX: &str = "follow";

#[program]
pub mod anchor_blog {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>, blog_account_bump: u8) -> ProgramResult {
        let blog_account = &mut ctx.accounts.blog_account;
        
        blog_account.bump = blog_account_bump;
        blog_account.update_authority = *ctx.accounts.update_authority.to_account_info().key;
        
        Ok(())
    }

    pub fn follow_blog(ctx: Context<FollowBlog>, follow_account_bump: u8) -> ProgramResult {
        let follow_account = &mut ctx.accounts.follow_account;
        
        follow_account.bump = follow_account_bump;
        follow_account.parent = *ctx.accounts.follower_blog_account.to_account_info().key;
        follow_account.target = *ctx.accounts.blog_account.to_account_info().key;
        follow_account.update_authority = *ctx.accounts.update_authority.to_account_info().key;
        
        Ok(())
    }

    pub fn create_post(ctx: Context<CreatePost>, post_account_bump: u8, data: PostMetadata) -> ProgramResult {
        let post_account = &mut ctx.accounts.post_account;
        let blog_account = &mut ctx.accounts.blog_account;
        
        post_account.bump = post_account_bump;
        post_account.entry = blog_account.post_count;
        post_account.data.title = data.title;
        post_account.data.description = data.description;
        post_account.data.uri = data.uri;
        blog_account.post_count += 1;
        
        post_account.update_authority = *ctx.accounts.update_authority.to_account_info().key;
        Ok(())
    }

    pub fn update_post(ctx: Context<UpdatePost>, data: PostMetadata) -> ProgramResult {
        let post_account = &mut ctx.accounts.post_account;
        
        post_account.data.title = data.title;
        post_account.data.description = data.description;
        post_account.data.uri = data.uri;
        
        Ok(())
    }

    pub fn publish_post(ctx: Context<PublishPost>) -> ProgramResult {
        let post_account = &mut ctx.accounts.post_account;
        
        post_account.state = PostState::Published;
        
        Ok(())
    }

    pub fn like_post(ctx: Context<LikePost>) -> ProgramResult {
        let post_account = &mut ctx.accounts.post_account;
        
        post_account.likes += 1;
        
        Ok(())
    }
}

#[account]
#[derive(Default)]
pub struct Blog {
    pub bump: u8,
    pub post_count: u32,
    pub update_authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PostState {
    Drafted,
    Published,
}

impl Default for PostState {
    fn default() -> Self {
        PostState::Drafted
    }
}

#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PostMetadata {
    pub description: String,
    pub title: String,
    pub uri: String,
}

#[account]
#[derive(Default)]
pub struct Post {
    pub bump: u8,
    pub data: PostMetadata,
    pub entry: u32,
    pub likes: u32,
    pub state: PostState,
    pub update_authority: Pubkey,
}

#[account]
#[derive(Default)]
pub struct Follow {
    pub bump: u8,
    pub update_authority: Pubkey,
    pub parent: Pubkey, // Parent is the account that is following.
    pub target: Pubkey, // Target is the account that is being followed. 
}

#[derive(Accounts)]
#[instruction(blog_account_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [
            BLOG_PREFIX.as_bytes(),
            update_authority.key().as_ref(),
        ],
        bump = blog_account_bump,
        payer = update_authority
    )]
    blog_account: Account<'info, Blog>,
    #[account(mut)]
    update_authority: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(follow_account_bump: u8)]
pub struct FollowBlog<'info> {
    blog_account: Account<'info, Blog>,
    #[account(
        init,
        seeds = [
            FOLLOW_PREFIX.as_bytes(),
            blog_account.key().as_ref(),
            follower_blog_account.key().as_ref(),
        ],
        bump = follow_account_bump,
        payer = update_authority
    )]
    follow_account: Account<'info, Follow>,
    #[account(
        constraint = blog_account.key() != follower_blog_account.key(),
        has_one = update_authority
    )]
    follower_blog_account: Account<'info, Blog>,
    #[account(mut)]
    update_authority: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(post_account_bump: u8, data: PostMetadata)]
pub struct CreatePost<'info> {
    #[account(mut, has_one = update_authority)]
    pub blog_account: Account<'info, Blog>,
    #[account(
        init,
        seeds = [
            POST_PREFIX.as_bytes(),
            blog_account.key().as_ref(),
            blog_account.post_count.to_le_bytes().as_ref()
        ],
        bump = post_account_bump,
        payer = update_authority,
        space = 1000
    )]
    pub post_account: Account<'info, Post>,
    #[account(mut)]
    pub update_authority: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(data: PostMetadata)]
pub struct UpdatePost<'info> {
    #[account(mut, has_one = update_authority)]
    pub post_account: Account<'info, Post>,
    pub update_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct PublishPost<'info> {
    #[account(mut, has_one = update_authority)]
    pub post_account: Account<'info, Post>,
    pub update_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct LikePost<'info> {
    #[account(mut)]
    pub post_account: Account<'info, Post>,
}

#[error]
pub enum ErrorCode {
    #[msg("Invalid follow")]
    InvalidFollow,
}