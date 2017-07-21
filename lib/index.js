import {SimpleCache} from './SimpleCache'
import {RedisCache} from './RedisCache'

export {
  RedisCache,
  SimpleCache,
}

// function (err, res) {}
const toPromise = function(fn) {
  return function() {
    const args = Array.from(arguments)
    return new Promise((resolve, reject) => {
      try{
        return resolve(fn.apply(null, args))
      }catch(e) {
        return reject(e)
      }
    })
  }
}

const isPromise = p => typeof p.then === 'function'

function variadic(fn, cache) {
  const args = Array.prototype.slice.call(arguments, 2)
  const cacheKey = JSON.stringify([fn.name].concat(args))
  const promise = isPromise(fn) ? fn : toPromise(fn)
  // console.log('cacheKey:', cacheKey)
  return cache.has(cacheKey).then(exist => {
    if (!exist) {
      return promise.apply(this, args).then(computedValue => {
        // console.log('cache setting...')
        return cache.set(cacheKey, computedValue).then(() => {
          // console.log('cache set', computedValue)
          return Promise.resolve(computedValue)
        })
      })
    }
    // console.log('cache hit')
    return cache.get(cacheKey)
  })
}

export default (fn, cache) => {
  const cacheClient = cache || new SimpleCache()
  return variadic.bind(this, fn, cacheClient)
}
