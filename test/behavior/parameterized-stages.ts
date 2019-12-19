
import * as sinon from 'sinon'
import * as tape from 'tape'
import tapeP from 'tape-promise'
const test = tapeP(tape)

import { parameterizedStages } from '../../src'
import { Fail } from '../../src/behavior/parameterized-stages'
import { withClock, delay } from '../common'

test('parameterized stages works, and aborts on exception', async t => {

  const injectedSpy = sinon.spy()
  const failSpy = sinon.spy()

  const init = async () => injectedSpy

  const stage = async (spy, args, fail) => {
    if (args.stage >= 2) {
      fail("artificial failure")
    }
    spy(args)
    return spy
  }

  const result = await parameterizedStages({
    init, stage,
    fail: failSpy,
    parameters: {
      frequency: t => 5000 - t * 1000,
      volume: t => 100 + 10 * t,
      stage: t => t,
    }
  })

  t.equal(result.error.message, 'artificial failure')

  const actualArgs = injectedSpy.getCalls().map(c => c.lastArg)
  t.deepEqual(actualArgs, [
    {
      frequency: 5000,
      volume: 100,
      stage: 0,
    },
    {
      frequency: 4000,
      volume: 110,
      stage: 1,
    },
    {
      frequency: 3000,
      volume: 120,
      stage: 2,
    },
  ])
  t.equal(failSpy.firstCall.args[0].message, 'artificial failure')

  t.end()
})

test('parameterized stages aborts on exception within stage', async t => {

  const injectedSpy = sinon.spy()
  const failSpy = sinon.spy()

  const init = async () => injectedSpy

  const stage = async (spy, args) => {
    if (args.stage >= 3) {
      throw new Error("artificial failure")
    }
    spy(args)
    return spy
  }

  const result = await parameterizedStages({
    init, stage,
    fail: failSpy,
    parameters: { stage: t => t }
  })

  t.equal(result.error.message, 'artificial failure')
  t.equal(injectedSpy.callCount, 3)
  t.ok(failSpy.calledOnce)
  t.equal(failSpy.firstCall.args[0].message, 'artificial failure')

  t.end()
})

test('parameterized stage failure can be triggered from outside', async t => {

  let failer: Fail | null = null
  const injectedSpy = sinon.spy()

  const init = async () => injectedSpy

  const stage = async (spy, args) => {
    spy(args)
    await delay(100)
    return spy
  }

  setTimeout(
    () => failer!(new Error('trigger error from outside')),
    250
  )

  const promise = parameterizedStages({
    init, stage,
    // reach in and grab the internal fail function so we can call it externally
    failHandler: (fail => { failer = fail }),
    parameters: { stage: t => t }
  })

  const result = await promise

  t.equal(injectedSpy.callCount, 3)
  t.equal(result.error.message, 'trigger error from outside')

  t.end()
})