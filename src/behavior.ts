/**
 * Behavior testing
 *
 *
 *
 */

import { ScenarioApi } from '@holochain/tryorama/lib/api'


type BehaviorConstructorArgs<D> = {
  init: BehaviorInit<D>,
  stage: BehaviorStage<D>,
  parameters: BehaviorParams,
}

type BehaviorRunArgs = {
  stageDurationMs: number
}

export class Behavior<D> {

  init: BehaviorInit<D>
  stage: BehaviorStage<D>
  paramDefs: BehaviorParams

  constructor(args: BehaviorConstructorArgs<D>) {
    this.init = args.init
    this.stage = args.stage
    this.paramDefs = args.parameters
  }

  genArgs = (paramDefs: BehaviorParams, stage: number): BehaviorArgs => {
    const args: BehaviorArgs = {}
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
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!! BEHAVIOR TEST FAILED !!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

error: ${e}
stage: ${stage}
args: ${JSON.stringify(args, null, 2)}
        `)
        throw e
      }
    }
  }

  static param = <P>(name: string, func: BehaviorParamFunction<P>): BehaviorParamDef<P> => [name, func]
}

type BehaviorArgs = Record<string, any>
type BehaviorInit<D> = () => Promise<D>
type BehaviorStage<D> = (state: D, args: BehaviorArgs) => Promise<D>
type BehaviorParamFunction<P> = (t: number) => P
type BehaviorParamDef<P> = [string, BehaviorParamFunction<P>]
// type BehaviorParams1<P> = [BehaviorParamDef<P>]
// type BehaviorParams2<P, Q> = [BehaviorParamDef<P>, BehaviorParamDef<Q>]
// type BehaviorParams3<P, Q, R> = [BehaviorParamDef<P>, BehaviorParamDef<Q>, BehaviorParamDef<R>]
// type BehaviorParams4<P, Q, R, S> = [BehaviorParamDef<P>, BehaviorParamDef<Q>, BehaviorParamDef<R>, BehaviorParamDef<S>]
type BehaviorParamsN = Array<BehaviorParamDef<any>>
type BehaviorParams = BehaviorParamsN
