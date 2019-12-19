import logger from "../logger"
import * as R from 'ramda'

/**
 *
 *
 * Periodically run a function for a given amount of time.
 * Returns a promise that resolves when the specified duration has passed and the function will run no longer
 *
 */
export const periodically = <D>(a: PeriodicallyArgs, action: () => Promise<any>) => new Promise((fulfill) => {
  const {period, awaitAll} = a
  let {duration} = a
  let promises: Array<Promise<any>> = []
  if (duration < period) {
    throw new Error("duration is less than the period: no action will occur!")
  } else if (duration % period === 0) {
    // if the end of duration exactly overlaps with the end of the last period,
    // then cut the duration short so we don't end both at the same time
    duration -= 1
  }
  logger.debug('Periodically: starting', duration, period)
  const each = () => {
    logger.debug('Periodically: running action')
    // TODO: collect promises for a big Promise.all at the end?
    promises.push(action())
  }
  each()
  const interval = setInterval(each, period)
  logger.debug('Periodically: setInterval')
  setTimeout(() => {
    clearInterval(interval)
    logger.debug('Periodically: fulfilled')
    if (awaitAll) {
      fulfill(Promise.all(promises))
    } else {
      fulfill()
    }
  }, duration)
})

type PeriodicallyArgs = {
  duration: number,
  period: number,
  awaitAll?: boolean,
}

export const stochasticPiecewise = (weightedFuncs: Array<[Function, number]>): Function => {

  // get normalized probabilities from the weights
  const totalProb = R.sum(weightedFuncs.map(([_, prob]) => prob))
  weightedFuncs = weightedFuncs.map(([fn, prob]) => [fn, prob / totalProb])

  return () => {
    const random = Math.random()
    let cumulative = 0

    for (const pair of weightedFuncs) {
      const [fn, prob] = pair
      cumulative += prob
      if (cumulative >= random) {
        return fn()
      }
    }
  }
}