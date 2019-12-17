import * as R from 'ramda'

export const stochasticPiecewise = (weightedFuncs: Array<[Function, number]>): Function => {

  // get normalized probabilities from the weights
  const totalProb = R.sum(weightedFuncs.map(([_, prob]) => prob))
  weightedFuncs = weightedFuncs.map(([fn, prob]) => [fn, prob / totalProb])

  return () => {
    const random = Math.random()
    let cumulative = 0

    for (const pair of weightedFuncs) {
      const [fn, prob] = pair
      cumulative += prob
      if (cumulative >= random) {
        return fn()
      }
    }
  }
}