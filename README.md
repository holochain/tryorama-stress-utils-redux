# tryorama-stress-utils

A small API to help with writing tryorama tests involving many conductors and instances.

Includes a `Batch` class to wrap a collection of Conductors, which exposes helpful map functions for iterating over instances and performing operations in series or in parallel


## behavior

This package also provides some helpers for running a test over and over, changing the conditions each time, until a stopping condition is met or the test breaks. Useful for running some canonical behavior over and over and ramping up the intensity until something breaks, thus finding the performance threshold.

### `periodically({duration, period})`

Runs the specified closure once every `period` ms for `duration` ms total

### stochasticPiecewise([[fn, weight]])

Returns a function. Associates a weight with each input function, so that each time the output function is called, one of the input functions will be called randomly with the specified weight. The weights are automatically normalized and need not add up to 1.

In the following example, calling `fn` will result in a 50% chance of calling `fn1`, 30% for `fn2`, and 20% for `fn3`

```js
const fn = stochasticPiecewise([
  [fn1, 5],
  [fn2, 3],
  [fn3, 2],
])

fn()
```

### parameterizedStages({init, stage, stageLimit, parameters, [fail], [failHandler]})

A bit like a fold/reduce function, with parameters that change during each iteration.

`stage(data, params, [fail])` is the function which will be run at each iteration. It takes `data`, which is the value returned by the previous iteration (or `init` if this is the first stage); and `params`, which are the changing parameters. If the `fail` arg is passed to parameterizedStages, that function will also be injected here to cause failures.

`stageLimit: number` stops execution after this many iterations

`parameters` is an object that defines the parameters to be passed into `stage`, each associated with a function that will describe what the parameter will be at a given stage.

`fail` (optional) is a function that is injected into the `stage`, which is useful for integrating with other testing harnesses, for instance when using Tape, setting `fail = t.fail` leads to a better experience

`failHandler` is a closure that will get called at test instantiation, and allows one-time access to the `fail` function outside of this class. This allows external code to cause the test to fail, useful for e.g. implementing a global timeout for tests in your test suite, where any test will be ended after that timeout.

Full example with tryorama:

```js

import * as R from 'ramda'

import { Config } from '@holochain/tryorama'
import { Orchestrator, tapeExecutor, singleConductor, compose, localOnly, groupPlayersByMachine } from '@holochain/tryorama'
import { parameterizedStages, periodically } from '@holochain/tryorama-stress-utils'

process.on('unhandledRejection', error => {
  console.error('got unhandledRejection:', error);
});

const network = {
  type: 'sim2h',
  sim2h_url: "ws://localhost:9002",
}

const dna = Config.dna('../dist/passthrough-dna.dna.json', 'passthrough')

console.log("using dna: "+ JSON.stringify(dna))
console.log("using network: "+ JSON.stringify(network))
const orchestrator = new Orchestrator()

const commonConfig = {
  network,
  logger: Config.logger(true)
}

const config = Config.gen(
  {app: dna, bob: dna},
  commonConfig
)

orchestrator.registerScenario("Behavior: Can commit an entry then get", async (s, t) => {
  const duration = 5000
  const multiplier = 0.5
  const init = () => s.players({ alice: config }, true)
  const stage = async ({alice, bob}, {period}) => {
    // Run the provided closure for `duration` ms, once every `period` ms
    await periodically({duration, period}, async () => {
      const result = await alice.call("app", "main", "commit_entry", { content: "entry content ..." })
      console.log(result)
      t.ok(result.Ok)

      await s.consistency()

      const get_result = await bob.call("app", "main", "get_entry", { address: result.Ok })
      console.log(get_result)
      t.deepEqual(get_result.Ok.App[1], "entry content ...")
    })
    return {alice, bob}
  }

  // Run the main machinery.
  // 0. run `init` and pass the
  await parameterizedStages({
    init, stage,
    fail: t.fail,
    parameters: {
      // period starts at 1000 and changes by `multiplier` each step
      // e.g. with multipler == 0.5, the period halves at every stage
      period: t => 1000 * Math.pow(multiplier, t),
    }
  })
})

orchestrator.run()
```