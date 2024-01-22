import { name, version } from '../package.json'

import all from './configs/all'
import recommended from './configs/recommended'

import { rules } from './rules'

const plugin = {
  meta: {
    name,
    version,
  },
  rules,
  configs: {
    all,
    recommended,
  },
}

module.exports = plugin
