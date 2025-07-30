import { Context, Next } from 'koa'
import { ZodType } from 'zod'

export let withBody = (schema: ZodType) => (ctx: Context, next: Next) => {
  let body = ctx.request.body
  let result = schema.safeParse(body)

  if (result.success) {
    ctx.request.body = result.data
    return next()
  } else {
    ctx.response.status = 400
    ctx.body = {
      code: result.error.type,
      message: result.error.message,
    }
  }
}
