#!/usr/bin/env node
import { main } from './cli-main'

main().catch((err) => {
  console.error(err)
})
