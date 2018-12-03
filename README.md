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
- [x] Support for outgoing websocket connections
- [ ] Queues

# Fixes
- [ ] Support for websocket open event (currently a race condition)
- [ ] Track down conversion errors
- [ ] Detect subcriptions to http and websocket
- [ ] aaa collision detection
- [ ] Record log messages and replay based on time

# SaaS
- [ ] CNAME support
- [ ] Sandboxing fetch better
- [ ] Penetration testing isolated-vm
- [ ] Scaling - proxy server, certificates
- [ ] Scaling - multiple instances
- [ ] Scaling - quorum, coordination
- [ ] Scalable storage backend
- [ ] Lifecycle events
- [ ] Secret management?
