use anchor_lang::prelude::*;
use post::cpi::accounts::Create;
use post::program::Post;
use post::{self, BlogData, PostData};

declare_id!("GkVkSsuDd8aDrgtD2VALYg7A16RHVxcyknyhmCMFmzWH");

#[program]
pub mod anchor_blog {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, blog_account_bump: u8) -> ProgramResult {
        ctx.accounts.blog_account.bump = blog_account_bump;
        Ok(())
    }

    pub fn create_post(ctx: Context<CreatePost>, post_account_bump: u8) -> ProgramResult {
        let cpi_program = ctx.accounts.post_program.to_account_info();
        let cpi_accounts = Create {
            post_account: ctx.accounts.post_account.to_account_info(),
            blog_account: ctx.accounts.blog_account.to_account_info(),
            user: ctx.accounts.user.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        ctx.accounts.blog_account.post_count += 1;
        let entry = ctx.accounts.blog_account.post_count;
        
        post::cpi::create(cpi_ctx, post_account_bump, entry)
    }
}

#[derive(Accounts)]
#[instruction(blog_account_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [
            b"blog_account".as_ref(),
        ],
        bump = blog_account_bump,
        payer = user
    )]
    blog_account: Account<'info, BlogData>,
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(post_account_bump: u8)]
pub struct CreatePost<'info> {
    #[account(mut)]
    pub blog_account: Account<'info, BlogData>,
    pub post_program: Program<'info, Post>,
    #[account(
        init,
        seeds = [
            b"post".as_ref(),
            blog_account.key().as_ref(),
            &[blog_account.post_count as u8].as_ref()
        ],
        bump = post_account_bump,
        payer = user
    )]
    pub post_account: Account<'info, PostData>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>
}
