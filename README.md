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
- [ ] Immediate mode?
- [ ] Fix error Unhandled rejection TypeError: Cannot convert undefined or null to object
    at Object.enable (/Users/tcoats/source/tumu-host/src/isolate.js:71:5)
    at aaa.then (/Users/tcoats/source/tumu-host/src/protocol/app-create.js:24:13)
    at tryCatcher (/Users/tcoats/source/tumu-host/node_modules/bluebird/js/main/util.js:26:23)
    at Promise._settlePromiseFromHandler (/Users/tcoats/source/tumu-host/node_modules/bluebird/js/main/promise.js:510:31)
    at Promise._settlePromiseAt (/Users/tcoats/source/tumu-host/node_modules/bluebird/js/main/promise.js:584:18)
    at Async._drainQueue (/Users/tcoats/source/tumu-host/node_modules/bluebird/js/main/async.js:128:12)
    at Async._drainQueues (/Users/tcoats/source/tumu-host/node_modules/bluebird/js/main/async.js:133:10)
    at Immediate.Async.drainQueues [as _onImmediate] (/Users/tcoats/source/tumu-host/node_modules/bluebird/js/main/async.js:15:14)
    at runCallback (timers.js:694:18)
    at tryOnImmediate (timers.js:665:5)
    at processImmediate (timers.js:647:5)

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
