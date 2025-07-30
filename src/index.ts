import Router from '@koa/router'
import koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { z } from 'zod'
import dotenv from 'dotenv'
import views from 'koa-views'
import path from 'node:path'
import serve from 'koa-static'
import { minutesToMilliseconds, uuid } from './util'
import { notFound, log, withBody, normalize } from './middleware'

dotenv.config()

const PORT = process.env['PORT'] ?? 3000
const APP_NAME = process.env['APP_NAME'] ?? 'Note Pass'
const MAX_MESSAGE_LENGTH = 5_096 // 5 KiB

const bodySchema = z.object({
  id: z.string().trim().optional(),
  ttl: z.coerce
    .number()
    .int()
    .min(1)
    .max(60 * 24 * 7 * 30),
  text: z.string().min(1).max(MAX_MESSAGE_LENGTH).trim(),
})

interface Snippet {
  id: string
  text: string
  expires: number
}

let app = new koa()
let router = new Router()
let snippets = new Map<string, Snippet>()

router.get('', async ctx => {
  await ctx.render('index', { title: APP_NAME })
})

router.post('/s', withBody(bodySchema), async ctx => {
  let body = ctx.request.body as z.infer<typeof bodySchema>
  let id = body.id || uuid(8)
  snippets.set(id, {
    id,
    text: body.text,
    expires: Date.now() + minutesToMilliseconds(body.ttl),
  })

  return ctx.redirect(`/s/${id}`)
})

router.get('/s/:id', async ctx => {
  let id = ctx.params['id']
  let snippet = snippets.get(id)
  let now = Date.now()

  if (!snippet || snippet.expires < now) {
    return 404
  }

  await ctx.render('snippet', { snippet })
})

app
  .use(log)
  .use(notFound)
  .use(normalize)
  .use(
    views(path.join(__dirname, '..', 'views'), {
      extension: 'pug',
    })
  )
  .use(serve(path.join(__dirname, '..', 'public')))
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(PORT)

setInterval(() => {
  let now = Date.now()
  for (let [id, snippet] of snippets) {
    if (snippet.expires < now) {
      snippets.delete(id)
    }
  }
}, 1000 * 60) // Every minute

console.log(`App listening on ${PORT}`)
