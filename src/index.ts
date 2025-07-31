import Router from '@koa/router'
import multer from '@koa/multer'
import koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { z } from 'zod'
import views from '@ladjs/koa-views'
import serve from 'koa-static'
import path from 'node:path'

import { minutesToMilliseconds, uuid } from './util'
import { notFound, log, withBody, normalize } from './middleware'

const PORT = process.env['PORT'] ?? 3000
const MAX_MESSAGE_LENGTH = 5_096 // 5 KiB
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 4 // 20 MiB
const ONE_MONTH_IN_MINUTES = 60 * 24 * 7 * 30 // 30 days in minutes

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: MAX_FILE_SIZE,
  },
})

const bodySchema = z.object({
  id: z.string().trim().optional(),
  ttl: z.coerce.number().int().min(1).max(ONE_MONTH_IN_MINUTES).default(5),
  text: z.string().max(MAX_MESSAGE_LENGTH).trim().optional(),
})

interface FileSpec {
  buffer: Buffer
  name: string
}

interface Snippet {
  id: string
  text?: string
  files: FileSpec[]
  expires: number
}

let app = new koa()
let router = new Router()
let snippets = new Map<string, Snippet>()

router.get('', ctx => ctx.render('index'))

router.post('/s', upload.any(), withBody(bodySchema), async ctx => {
  let body = ctx.request.body as z.infer<typeof bodySchema>
  let id = body.id || uuid(8)

  if (snippets.has(id)) {
    ctx.throw(409, 'Snippet with this ID already exists')
  }

  let files =
    (ctx.files as multer.File[] | undefined)?.map(file => ({
      buffer: file.buffer,
      name: file.originalname,
    })) ?? []

  if (files.length === 0 && !body.text) {
    ctx.throw(400, 'Snippet must contain either text or files')
  }

  snippets.set(id, {
    id,
    text: body.text,
    files,
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

  if (ctx.accepts('html')) {
    await ctx.render('snippet', { snippet })
  } else {
    ctx.body = snippet.text
  }
})

router.get('/s/:id/file/:index', async ctx => {
  let id = ctx.params['id']
  let index = parseInt(ctx.params['index'], 10)
  let snippet = snippets.get(id)

  if (!snippet || isNaN(index) || index < 0 || index >= snippet.files.length) {
    return ctx.throw(404, 'Snippet not found')
  }

  let file = snippet.files[index]

  if (!file) {
    return ctx.throw(404, 'File not found')
  }

  ctx.set('Content-Disposition', `attachment; filename="${file.name}"`)
  ctx.body = file.buffer
})

let staticMiddleware = serve(path.join(__dirname, '..', 'public'))
let viewMiddleware = views(path.join(__dirname, '..', 'views'), {
  extension: 'pug',
})

app
  .use(log)
  .use(notFound)
  .use(normalize)
  .use(viewMiddleware)
  .use(staticMiddleware)
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
