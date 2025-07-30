import { Context, Next } from 'koa'

export async function notFound(ctx: Context, next: Next) {
  await next()

  if (ctx.status === 404) {
    await ctx.render('not-found', {})
    ctx.status = 404
  }
}
