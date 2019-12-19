/**
 * Parameterized behavior testing
 */

import * as _ from 'lodash'
import logger from '../logger'

type ConstructorArgs<D> = {
  init: Init<D>,
  stage: Stage<D>,
  parameters: Params,
  fail?: Fail,
}

export type Args = Record<string, any>
export type Init<D> = () => Promise<D>
export type Stage<D> = (state: D, args: Args, fail: Fail) => Promise<D>
type ParamFunction<P> = (t: number) => P
type Params = Record<string, ParamFunction<any>>
type Fail = (error: Error) => void
type FailInfo = {
  error: Error,
  stage: number,
  args: Args,
}

export const parameterizedStages = async <D>(a: ConstructorArgs<D>): Promise<FailInfo> => {
  const {init, stage, parameters} = a
  let failure: Error | null = null
  const fail: Fail = (error: Error) => {
    if (!(error instanceof Error)) {
      error = new Error(error)
    }
    if (a.fail) {
      a.fail(error)
    }
    failure = error
  }
  let data: D = await init()
  let time = 0
  let args: Args | null = null

  while (!failure) {
    logger.debug("parameterizedStages: stage", time)
    args = genArgs(parameters, time)
    logger.debug("parameterizedStages: generated args:", args)
    try {
      data = await stage(data, args, fail)
      time += 1
    } catch (e) {
      failure = e
    }
  }

  const failInfo = {
    stage: time,
    args: args!,
    error: failure,
  }

  onFail(failInfo)
  return failInfo
}

const genArgs = (paramDefs: Params, stage: number): Args => {
  return _.mapValues(paramDefs, generator => generator(stage))
}

const onFail = ({stage, args, error}) => {
  console.error(`
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!! PARAMETERIZED BEHAVIOR TEST FAILED !!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

stage: ${stage}
args: ${JSON.stringify(args, null, 2)}
error: ${error}
  `)
}