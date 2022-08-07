import { Command } from 'commander'

const program = new Command()

program.name('css panda')

program.command('dev').description('Initialize css panda')

program.command('build').description('Build css panda')

program.parse()
