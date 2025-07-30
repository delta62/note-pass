import { Context, Next } from 'koa'

export async function log(ctx: Context, next: Next) {
  let start = Date.now()
  await next()
  let ms = Date.now() - start
  console.log(`[${ctx.status}] ${ctx.method} ${ctx.url} - ${ms}ms`)
}
