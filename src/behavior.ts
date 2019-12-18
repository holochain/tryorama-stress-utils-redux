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

export const parameterizedStages = async <D>(a: ConstructorArgs<D>): Promise<void> => {
  const {init, stage, parameters} = a
  let shouldContinue = true
  let data: D = await init()
  let time = 0

  while (shouldContinue) {
    logger.debug("parameterizedStages: stage", time)
    const args = genArgs(parameters, time)
    logger.debug("parameterizedStages: generated args:", args)
    try {
      data = await stage(data, args)
      time += 1
    } catch (e) {
      console.error(`
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!! PARAMETERIZED BEHAVIOR TEST FAILED !!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

error: ${e}
stage: ${time}
args: ${JSON.stringify(args, null, 2)}
      `)
      throw e
    }
  }
}

const genArgs = (paramDefs: Params, stage: number): Args => {
  return _.mapValues(paramDefs, generator => generator(stage))
}

export type Args = Record<string, any>
export type Init<D> = () => Promise<D>
export type Stage<D> = (state: D, args: Args) => Promise<D>
type ParamFunction<P> = (t: number) => P
type Params = Record<string, ParamFunction<any>>
