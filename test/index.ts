import * as tape from 'tape'
import tapeP from 'tape-promise'
const test = tapeP(tape)

import {configBatchSimple} from '../src'
import { Config, ConfigSeedArgs } from '@holochain/tryorama'

const fakeArgs: ConfigSeedArgs = {
  scenarioName: 'scenarioName',
  playerName: 'playerName',
  uuid: 'uuid',
  interfacePort: 0,
  configDir: 'configDir',
}

test('configBatchSimple', async t => {
  const dna = Config.dna('fake')
  const seeds = configBatchSimple(3, 2, dna, {})
  const configs = await Promise.all(seeds.map(seed => seed(fakeArgs)))
  t.equal(configs.length, 3)
  for(let i = 0; i < 3; i++) {
    t.equal(configs[i].agents.length, 2)
    t.equal(configs[i].agents[0].name, 'playerName::instance-0::uuid')
    t.equal(configs[i].agents[1].name, 'playerName::instance-1::uuid')
    t.equal(configs[i].instances.length, 2)
  }
  t.end()
})
