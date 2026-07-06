#!/usr/bin/env node
import { createConnection, ProposedFeatures } from 'vscode-languageserver'
import { createServer } from '../dist/index.js'

createServer(createConnection(ProposedFeatures.all))
