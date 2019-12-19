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
  failHandler?: FailHandler,
}

export type Args = Record<string, any>
export type Init<D> = () => Promise<D>
export type Stage<D> = (state: D, args: Args, fail: Fail) => Promise<D>
export type ParamFunction<P> = (t: number) => P
export type Params = Record<string, ParamFunction<any>>
export type Fail = (error: Error) => void
export type FailHandler = (fail: Fail) => void
export type FailInfo = {
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

  if (a.failHandler) {
    a.failHandler(fail)
  }

  let data: D = await init()
  let time = 0
  let args: Args | null = null

  while (!failure) {
    args = genArgs(parameters, time)
    logger.info(`
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@ Parameterized Stage: ${time}
@@@ Args: ${JSON.stringify(args)}
    `)
    try {
      data = await stage(data, args, fail)
      time += 1
    } catch (e) {
      fail(e)
    }
  }

  const failInfo = {
    stage: time,
    args: args!,
    error: failure,
  }

  onFail(failInfo, data)
  return failInfo
}

const genArgs = (paramDefs: Params, stage: number): Args => {
  return _.mapValues(paramDefs, generator => generator(stage))
}

const onFail = ({stage, args, error}, data) => {
  const nullDataWarning = data
  ? ''
  : `
The parameterized stage received no data as an argument.
Did you forget to make your \`init\` or \`stage\` function return something?
`

  logger.info(`
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!! PARAMETERIZED BEHAVIOR TEST FAILED !!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
${nullDataWarning}
stage: ${stage}
args: ${JSON.stringify(args, null, 2)}
error: ${error}
  `)
}
