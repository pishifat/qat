# qat

...aka NAT/BN Management, where the NAT handles BN applications and a bunch of other mapping/modding related things.

## Requirements

- node
- mongodb

If you want to contribute, make a copy of `config.example.json` titled `config.json` and fill out the fields below

- `session`: express session secret
- `v1token`: osu! apiv1 key
- `id`: osu! apiv2 oauth id
- `secret`: osu! apiv2 oauth secret
- `redirect`: osu! apiv2 oauth redirect (if it isn't `http://localhost:8080/callback` you need to change port in `webpack.dev.config.js` and `/callback` route in `index.js`)
- `connection`: connection to mongodb
- `interOpAccess`: for /interOp routes (optional)
- webhooks: https://discord.com/developers/docs/resources/webhook (optional)

Once config is set up, type `npm i` then `npm run dev` in console. You'll be able to connect on `http://localhost:8080`. 

Running the project sucks if you don't have data. One day I'll set up sample data, but enjoy the inconvenience until then!

## Nomination data

Some people use this website's /interOp routes for nomination data. If you're one of these people, tell me what you'd be doing with the info and I'll probably give you an access key. Don't share your key with anyone else.