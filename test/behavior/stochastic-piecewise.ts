import * as tape from 'tape'
import * as R from 'ramda'
import tapeP from 'tape-promise'
const test = tapeP(tape)
import { stochasticPiecewise } from '../../src/behavior'
import * as sinon from 'sinon'


test('can define a stochastic piecewise function', async t => {
  const spy1 = sinon.spy()
  const spy2 = sinon.spy()
  const spy3 = sinon.spy()

  const sp = stochasticPiecewise([
    [spy1, 5],
    [spy2, 3],
    [spy3, 2],
  ])

  for (const i of R.range(0, 10000)) {
    sp()
  }

  // since the test is stochastic, we can't make any exact numerical assertions,
  // but we know roughly what the relative frequencies of function calls will be.
  t.ok(spy1.callCount > spy2.callCount)
  t.ok(spy2.callCount > spy3.callCount)
  t.ok(spy3.callCount > 0)

  t.end()
})