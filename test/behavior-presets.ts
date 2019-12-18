
import * as tape from 'tape'
import * as R from 'ramda'
import tapeP from 'tape-promise'
const test = tapeP(tape)
import { periodically } from '../src'
import * as sinon from 'sinon'
import { withClock, delay } from './common'


test('can define a Periodicaly running function', withClock(async (t, clk) => {
  const spy = sinon.spy()

  const promise = periodically({period: 1000, duration: 10000}, () => spy())

  t.equal(spy.callCount, 1)
  clk.tick(4000)
  t.equal(spy.callCount, 5)

  clk.tick(6000)

  await t.doesNotReject(promise)
  t.equal(spy.callCount, 10)

  t.end()
}))
