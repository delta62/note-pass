import { Context, Next } from 'koa'

export async function normalize(ctx: Context, next: Next) {
  const path = ctx.path

  if (path.length > 1 && path.endsWith('/')) {
    const query = ctx.url.slice(ctx.path.length) // keep query string
    ctx.status = 301
    ctx.redirect(path.slice(0, -1) + query)
    return
  }

  await next()
}
