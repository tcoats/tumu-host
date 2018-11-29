const ivm = require('isolated-vm')


module.exports = (params) =>
  params.context.global.set('_schedule', new ivm.Reference((timestamp, fn) => {
    const now = Date.now()
    if (now > timestamp) fn.apply(undefined, []).catch(() => {})
    else setTimeout(
      () => fn.apply(undefined, []).catch(() => {}),
      timestamp - now)
  }))
  .then(() => params.isolate.compileScript('new ' + function() {
    const ivm = _ivm
    const schedule = _schedule; delete _schedule
    global.schedule = (timestamp, fn) => schedule.apply(undefined, [
      new ivm.ExternalCopy(timestamp).copyInto(),
      new ivm.Reference(fn)
    ])
  }))
  .then((script) => script.run(params.context))