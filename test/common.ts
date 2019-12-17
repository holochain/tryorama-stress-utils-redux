
import * as sinon from 'sinon'
import logger from '../src/logger'

export const withClock = f => async t => {
  const clock = sinon.useFakeTimers()
  logger.debug('withClock: running closure')

  await f(t, clock)

  logger.debug('withClock: restoring clock')
  clock.restore()

  logger.debug('withClock: returning')
}

export const delay = ms => new Promise(r => setTimeout(r, ms))