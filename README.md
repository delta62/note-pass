# Note Pass

A small web app for sharing bits of text or files across devices

## Usage

Regular NPM build process applies. There's also a Dockerfile. You
can run the built code out of `dist/`. By default, the server
listens on port 3000. You can change it with the `PORT` environment
variable.

```sh
npm i
npm run build
PORT=8080 node dist/index.js
```

The root page hosts a form for jotting stuff down. There are some
other URLs you can hit as well:

- `/s/:id` shows the content of a note
- `/s/:id/file/:index` returns the contents of file `index` uploaded
  to the given snippet

## Command line clients

You can hit the two above endpoints with a command-line client if you
need to read something from a server or similar.

**To get the content of a note**, set the `Accept` header to `text/plain`:

```sh
curl -H 'Accept: text/plain' http://notes.local/s/123abc
```

**To download a file**, simply hit the relevant endpoint:

```sh
curl -OJ http://notes.local/s/123abc/files/0
```

## Storage and other considerations

Files and notes are not saved to disk, they are kept in memory.
Memory is cleaned up every minute. Of course, someone can load
a web page with a note on it and leave that page open for long
after the exipration time.

This software isn't designed for encrypting sensitive information.
Since nothing is saved to disk you might trust it with sensitive
things if you trust the network and machine it runs on, but if
someone has the URL, they can read it.
