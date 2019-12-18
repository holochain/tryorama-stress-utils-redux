import * as tape from 'tape'
import tapeP from 'tape-promise'
const test = tapeP(tape)
import { periodically } from '../../src/behavior'
import * as sinon from 'sinon'
import { withClock, delay } from '../common'


test('can define a Periodically running function', withClock(async (t, clk) => {
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

test('`periodically` with awaitAll=false moves on even if promises are pending', withClock(async (t, clk) => {
  const spy1 = sinon.spy()
  const spy2 = sinon.spy()
  const spy3 = sinon.spy()

  const promise = periodically({period: 10, duration: 100, awaitAll: false}, async () => {
    spy1()
    await delay(1000)
    spy2()
  }).then(spy3)

  clk.tick(100)
  t.equal(spy1.callCount, 10)
  t.ok(spy2.notCalled)
  t.ok(spy3.notCalled)

  clk.tick(2000)
  await t.doesNotReject(promise)
  t.equal(spy1.callCount, 10)
  t.equal(spy2.callCount, 10)
  t.ok(spy3.calledBefore(spy2))  // this is the key difference

  t.end()
}))

test('`periodically` with awaitAll=true returns promise of all invocations', withClock(async (t, clk) => {
  const spy1 = sinon.spy()
  const spy2 = sinon.spy()
  const spy3 = sinon.spy()

  const promise = periodically({period: 10, duration: 100, awaitAll: true}, async () => {
    spy1()
    await delay(1000)
    spy2()
  }).then(spy3)

  clk.tick(100)
  t.equal(spy1.callCount, 10)
  t.ok(spy2.notCalled)
  t.ok(spy3.notCalled)

  clk.tick(2000)
  await t.doesNotReject(promise)
  t.equal(spy1.callCount, 10)
  t.equal(spy2.callCount, 10)
  t.ok(spy3.calledAfter(spy2))  // this is the key difference

  t.end()
}))