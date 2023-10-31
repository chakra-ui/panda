#!/usr/bin/env node

import updateNotifier from 'update-notifier'
import { handleError } from './errors'
import { main } from './cli-main'

import { name, version } from '../package.json'
updateNotifier({ pkg: { name, version }, distTag: 'latest' }).notify()
main().catch(handleError)
