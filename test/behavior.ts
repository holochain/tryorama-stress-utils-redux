
import * as test from 'tape'
// import tapeP from 'tape-promise'
// const test = tapeP(tape)
import { Player } from '@holochain/tryorama'
import { Behavior } from '../src'

// import * as sinon from 'sinon'

const C: any = undefined

test('can specify behavior', async t => {

  const collectedArgs: Array<any> = []

  const init = async () => {
    return null
    // return sinon.spy()
  }

  const stage = async (spy, args) => {
    if (args.stage >= 3) {
      throw new Error("artificial failure")
    }
    // spy.f(args)
    collectedArgs.push(args)
    return spy
  }

  const behavior = new Behavior({
    init, stage,
    parameters: [
      ['frequency', t => 5000 - t * 1000],
      ['volume', t => 100 + 10 * t],
      ['stage', t => t],
    ]
  })

  // await t.rejects(behavior.run(), /artificial failure/)

  try {
    await behavior.run()
  } catch (e) {
    t.equal(e.message, 'artificial failure')
  }

  t.deepEqual(collectedArgs, [
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

  t.end()
})