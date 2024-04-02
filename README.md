# qat

...aka BN Management, where the NAT handles BN applications and a bunch of other mapping/modding related things.

## Requirements

- node (18)
- mongodb

If you want to contribute, make a copy of `config.example.json` titled `config.json` and fill out the fields below

- `session`: express session secret
- `v1token`: osu! apiv1 key
- `id`: osu! apiv2 oauth id
- `secret`: osu! apiv2 oauth secret
- `redirect`: osu! apiv2 oauth redirect (if it isn't `http://localhost:8080/callback` you need to change port in `webpack.dev.config.js` and `/callback` route in `index.js`)
- `connection`: connection to mongodb
- `interOpAccess`: for /interOp routes (optional)
- `admin`: needed to work with extra site permissions
  - `pishifat`: pishifat's or your own osu! user id
  - `users`: array of users who will be granted the `isResponsibleWithButtons` permission

Optionally, you can make a copy of `webhooks.example.json` titled `webhooks.json` and fill out each webhook field.

A Discord webhook link is formatted as `https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN`, so fill each field with the corresponding id and token.

Once config is set up, type `npm i` then `npm run dev` in console. You'll be able to connect on `http://localhost:8080`.

Running the project sucks if you don't have data. One day I'll set up sample data, but enjoy the inconvenience until then!

## Data

Some people use this website's [`/interOp`](https://github.com/pishifat/qat/blob/master/routes/interOp.js) routes for various data. If you're one of these people, tell me what you'd be doing with the info and I'll probably give you an access key. Don't share your key with anyone else.

### WebSocket

The project supports websocket connections for a few data outputs, which requires interOp access. You can connect to `/websocket/interOp` with the following headers:

- `username`: your interOp username
- `secret`: your interOp secret
- `tags`: event tags that you want to listen to, separated by `+`

#### Available events

- `users:request_status_update`
- `data:content_review`

If you need websocket support for other events, please open a GitHub issue and/or contact me.
