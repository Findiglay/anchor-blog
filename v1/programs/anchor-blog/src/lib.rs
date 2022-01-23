use anchor_lang::prelude::*;

declare_id!("9PDAEyiU5GXhb3kJoGyasqT7tX2KxfE8Dpk7fY2c2WTY");

#[program]
pub mod anchor_blog {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>, blog_account_bump: u8) -> ProgramResult {
        let blog_account = &mut ctx.accounts.blog_account;
        
        blog_account.bump = blog_account_bump;
        blog_account.update_authority = *ctx.accounts.update_authority.to_account_info().key;
        
        Ok(())
    }

    pub fn follow_blog(ctx: Context<FollowBlog>) -> ProgramResult {
        let blog_account = &mut ctx.accounts.blog_account;
        let follower = &mut ctx.accounts.follower_account;
        
        blog_account.followers.push(*follower.to_account_info().key);
        follower.following.push(*blog_account.to_account_info().key);
        
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
    pub followers: Vec<Pubkey>,
    pub following: Vec<Pubkey>,
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

#[derive(Accounts)]
#[instruction(blog_account_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [
            b"blog".as_ref(),
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
pub struct FollowBlog<'info> {
    #[account(mut)]
    blog_account: Account<'info, Blog>,
    #[account(mut, has_one = update_authority)]
    follower_account: Account<'info, Blog>,
    update_authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(post_account_bump: u8, data: PostMetadata)]
pub struct CreatePost<'info> {
    #[account(mut, has_one = update_authority)]
    pub blog_account: Account<'info, Blog>,
    #[account(
        init,
        seeds = [
            b"post".as_ref(),
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
    #[msg("Can't follow yourself")]
    CannotFollowSelf,
}