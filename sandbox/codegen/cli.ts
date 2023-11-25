#!/usr/bin/env node

import cac from 'cac'
import { spawn } from 'child_process'

const cli = cac('sct')
const scenarioList = ['preact', 'qwik', 'react', 'solid', 'vue', 'strict']

const isValidScenario = (scenario) => {
  if (!scenarioList.includes(scenario)) {
    console.log(`Unknown scenario: ${scenario}`)
    return false
  }
  return true
}

const runCommand = (command: string, envVars = {}) => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ')
    const proc = spawn(cmd, args, {
      stdio: 'inherit',
      env: { ...process.env, ...envVars },
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error(`Command failed with exit code ${code}`)
        reject()
        return
      }
      resolve(0)
    })
  })
}

cli.command('').action(() => {
  return cli.outputHelp()
})

cli
  .command('test [scenario]', 'Run tests')
  .option('-u, --update', 'Update snapshots')
  .option('-w, --watch', 'Watch mode')
  .action(async (scenario, options) => {
    if (scenario && !isValidScenario(scenario)) return

    const commands = (scenario ? [scenario] : scenarioList).map((fw) => ({
      cmd: `pnpm vitest${options.update ? ' -u' : ''}${options.watch ? '' : ' run'}`,
      env: { MODE: fw },
    }))

    const results = await Promise.allSettled(commands.map(({ cmd, env }) => runCommand(cmd, env)))
    const failed = results.filter((result) => result.status === 'rejected')

    if (failed.length > 0) {
      console.error('Some commands failed:')
      process.exit(1)
    }
  })

cli.command('codegen [scenario]', 'Generate code').action(async (scenario) => {
  if (scenario && !isValidScenario(scenario)) return

  const commands = (scenario ? [scenario] : scenarioList).map(
    (fw) => `pnpm panda codegen --clean --config panda.${fw}.config.ts`,
  )

  await Promise.all(commands.map(runCommand))
})

cli.help()
cli.parse(process.argv, { run: false })

try {
  await cli.runMatchedCommand()
} catch (error) {
  console.error(error.stack)
  process.exit(1)
}
