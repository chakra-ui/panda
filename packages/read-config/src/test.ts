import { loadConfigFile } from './load'

async function main() {
  const result = await loadConfigFile()
  console.dir(result, { depth: null })
}

main()
