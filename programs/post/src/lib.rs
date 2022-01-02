use anchor_lang::prelude::*;

declare_id!("9rpW2hHNcka8J4LCUEerdcpUhTyJDcTqMKxfzpg4JG3x");

#[program]
pub mod post {
    use super::*;
    pub fn create(ctx: Context<Create>, post_account_bump: u8, entry: u8) -> ProgramResult {
        ctx.accounts.post_account.bump = post_account_bump;
        ctx.accounts.post_account.entry = entry;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(post_account_bump: u8)]
#[instruction(entry: u64)]
pub struct Create<'info> {
    pub blog_account: Account<'info, BlogData>,
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
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct BlogData {
    pub bump: u8,
    pub post_count: u8,
}

#[account]
#[derive(Default)]
pub struct PostData {
    pub bump: u8,
    pub entry: u8,
}