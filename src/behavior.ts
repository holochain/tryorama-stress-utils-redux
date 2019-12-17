/**
 * Parameterized behavior testing
 */

import * as _ from 'lodash'
import logger from './logger'

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
    return _.mapValues(paramDefs, generator => generator(stage))
  }

  // TODO: should there ever be a stopping condition other than failure?
  shouldContinue = () => true

  run = async () => {
    let data: D = await this.init()
    let stage = 0
    while (this.shouldContinue()) {
      logger.debug("behavior.run: stage", stage)
      const args = this.genArgs(this.paramDefs, stage)
      logger.debug("behavior.run: generated args:", args)
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

export type Args = Record<string, any>
export type Init<D> = () => Promise<D>
export type Stage<D> = (state: D, args: Args) => Promise<D>
type ParamFunction<P> = (t: number) => P
type Params = Record<string, ParamFunction<any>>
