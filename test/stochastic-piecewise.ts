
import * as tape from 'tape'
import * as R from 'ramda'
import tapeP from 'tape-promise'
const test = tapeP(tape)
import { Player } from '@holochain/tryorama'
import { stochasticPiecewise } from '../src'
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

  t.ok(spy1.callCount > spy2.callCount)
  t.ok(spy2.callCount > spy3.callCount)
  t.ok(spy3.callCount > 0)

  t.end()
})