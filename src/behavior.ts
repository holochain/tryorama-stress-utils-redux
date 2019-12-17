/**
 * Behavior testing
 *
 *
 *
 */

import { ScenarioApi } from '@holochain/tryorama/lib/api'


type ConstructorArgs<D> = {
  init: Init<D>,
  stage: Stage<D>,
  parameters: Params,
}

type RunArgs = {
  stageDurationMs: number
}

export class ParameterizedBehavior<D> {

  init: Init<D>
  stage: Stage<D>
  paramDefs: Params

  constructor(args: ConstructorArgs<D>) {
    this.init = args.init
    this.stage = args.stage
    this.paramDefs = args.parameters
  }

  genArgs = (paramDefs: Params, stage: number): Args => {
    const args: Args = {}
    paramDefs.forEach(([name, generator]) => {
      args[name] = generator(stage)
    })
    return args
  }

  // TODO: should there ever be a stopping condition other than failure?
  shouldContinue = () => true

  run = async () => {
    let data: D = await this.init()
    let stage = 0
    while (this.shouldContinue()) {
      const args = this.genArgs(this.paramDefs, stage)
      try {
        data = await this.stage(data, args)
        stage += 1
      } catch (e) {
        console.error(`
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!! PARAMETERIZED BEHAVIOR TEST FAILED !!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

error: ${e}
stage: ${stage}
args: ${JSON.stringify(args, null, 2)}
        `)
        throw e
      }
    }
  }
}

type Args = Record<string, any>
type Init<D> = () => Promise<D>
type Stage<D> = (state: D, args: Args) => Promise<D>
type ParamFunction<P> = (t: number) => P
type ParamDef<P> = [string, ParamFunction<P>]
// type Params1<P> = [ParamDef<P>]
// type Params2<P, Q> = [ParamDef<P>, ParamDef<Q>]
// type Params3<P, Q, R> = [ParamDef<P>, ParamDef<Q>, ParamDef<R>]
// type Params4<P, Q, R, S> = [ParamDef<P>, ParamDef<Q>, ParamDef<R>, ParamDef<S>]
type ParamsN = Array<ParamDef<any>>
type Params = ParamsN
