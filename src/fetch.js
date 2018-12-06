const ivm = require('isolated-vm')
const axios = require('axios')

const axiosResponseProperties = ['data', 'headers', 'statusText', 'status']

module.exports = (params) =>
  params.context.global.set('_fetch', new ivm.Reference((params, resolve, reject) => {
    try {
      axios(params).then((res) => {
        const payload = {}
        axiosResponseProperties.forEach((key) => payload[key] = res[key])
        resolve
          .apply(undefined, [new ivm.ExternalCopy(payload).copyInto()])
          .catch(() => {})
      }).catch((err) => {
        reject.apply(undefined, [
          new ivm.ExternalCopy(err.toString()).copyInto()])
        })
    } catch (err) {
      reject.apply(undefined, [new ivm.ExternalCopy(err).copyInto()])
    }
  }))
  .then(() => params.isolate.compileScript('new ' + function() {
    const ivm = _ivm
    const fetch = _fetch; delete _fetch
    global.fetch = (params) => new Promise((resolve, reject) =>
      fetch.apply(undefined, [
         new ivm.ExternalCopy(params).copyInto(),
         new ivm.Reference(resolve),
         new ivm.Reference(reject)
      ]))
    global.fetch.request = (...args) => global.fetch(...args)
    const urlOnlyMethods = ['get', 'delete', 'head', 'options']
    urlOnlyMethods.forEach((method) =>
      global.fetch[method] = (url, config) => {
        const params = { url: url, method: method }
        if (config) Object.assign(params, config)
        return global.fetch(params)
      })
    const urlAndDataMethods = ['post', 'put', 'patch']
    urlAndDataMethods.forEach((method) =>
      global.fetch[method] = (url, data, config) => {
        const params = { url: url, data: data, method: method }
        if (config) Object.assign(params, config)
        return global.fetch(params)
      })
  }))
  .then((script) => script.run(params.context))
