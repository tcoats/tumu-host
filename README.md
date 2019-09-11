# Tumu Host
Javascript Serverless Host

Use the [Tumu CLI](https://github.com/tcoats/tumu) to connect.

Install globally

```bash
npm i -g tumu-host
tumu-host
tumu-local
```

Or clone the repo and run directly

```bash
npm
npm start
```

# Todo
- [x] Support for outgoing websocket connections
- [ ] Remove someone from a workspace
- [ ] Queues
- [ ] Immediate mode?
- [ ] Code errors need to be returned

# Fixes
- [ ] Support for websocket open event (currently a race condition)
- [ ] Track down conversion errors
- [ ] Detect subcriptions to http and websocket
- [x] aaa2 collision detection
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
