# Tumu Host
Javascript Serverless Host

Use the [Tumu CLI](https://github.com/tcoats/tumu) to connect.

Install globally

```bash
yarn add global tumu-host
tumu-host
tumu-local
```

Or clone the repo and run directly

```bash
yarn
yarn start
```

# Todo
- [x] Errors need a good way to be logged
- [x] Hub available
- [x] Configuration options - port
- [x] stdlib inside the isolate
- [x] Emitter api
- [x] Pass requests, responses
- [x] Websockets
- [x] Fetch
- [x] map domains to apps
- [x] Refactor isolate file into stages
- [x] Simple key value storage - leveldb
- [x] Cron subscriptions
- [x] Local mode
- [ ] Support for outgoing websocket connections
- [ ] Queues

# Fixes
- [ ] Support for websocket open event (currently a race condition)
- [ ] Track down conversion errors
- [ ] Detect subcriptions to http and websocket
- [ ] aaa collision detection

# SaaS
- [ ] CNAME support
- [ ] Teams, mempership, invitations, listing apps, membership etc.
- [ ] Sandboxing fetch better
- [ ] Penetration testing isolated-vm
- [ ] Scaling - proxy server, certificates
- [ ] Scalable storage backend
- [ ] Lifecycle events
- [ ] Secret management?
