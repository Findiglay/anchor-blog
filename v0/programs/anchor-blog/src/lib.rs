use anchor_lang::prelude::*;

declare_id!("HkUTPinS5eZotWjoTqDpHWxXrcZqSfn79uQQgmTL5uxg");

#[program]
pub mod anchor_blog {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, blog_account_bump: u8) -> ProgramResult {
        ctx.accounts.blog_account.bump = blog_account_bump;
        ctx.accounts.blog_account.authority = *ctx.accounts.user.to_account_info().key;
        Ok(())
    }

    pub fn create_post(ctx: Context<CreatePost>, post_account_bump: u8, title: String, body: String) -> ProgramResult {
        ctx.accounts.post_account.bump = post_account_bump;
        ctx.accounts.post_account.authority = *ctx.accounts.authority.to_account_info().key;
        ctx.accounts.post_account.title = title;
        ctx.accounts.post_account.body = body;
        ctx.accounts.post_account.entry = ctx.accounts.blog_account.post_count;
        ctx.accounts.blog_account.post_count += 1;
        Ok(())
    }

    pub fn update_post(ctx: Context<UpdatePost>, title: String, body: String) -> ProgramResult {
        ctx.accounts.post_account.title = title;
        ctx.accounts.post_account.body = body;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(blog_account_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [
            b"blog_v0".as_ref(),
            user.key().as_ref(),
        ],
        bump = blog_account_bump,
        payer = user
    )]
    blog_account: Account<'info, Blog>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(post_account_bump: u8, title: String, body: String)]
pub struct CreatePost<'info> {
    #[account(mut, has_one = authority)]
    pub blog_account: Account<'info, Blog>,
    #[account(
        init,
        seeds = [
            b"post".as_ref(),
            blog_account.key().as_ref(),
            &[blog_account.post_count as u8].as_ref()
        ],
        bump = post_account_bump,
        payer = authority,
        space = 10000
    )]
    pub post_account: Account<'info, Post>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(tite: String, body: String)]
pub struct UpdatePost<'info> {
    #[account(mut, has_one = authority)]
    pub blog_account: Account<'info, Blog>,
    #[account(mut, has_one = authority)]
    pub post_account: Account<'info, Post>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(Default)]
pub struct Blog {
    pub bump: u8,
    pub post_count: u8,
    pub authority: Pubkey,
}

#[account]
#[derive(Default)]
pub struct Post {
    pub authority: Pubkey,
    pub bump: u8,
    pub entry: u8,
    pub title: String,
    pub body: String,
}
