import * as path from 'path'
import PinceauTokensManager from '../../manager'

async function runTest (
  fixturePath: string
) {
  const tokensManager = new PinceauTokensManager()

  await tokensManager.syncTokens([path.join(__dirname, fixturePath)], { debug: true, missingTokenHintSeverity: 'error', tokensOutput: [path.join(__dirname, '../fixtures/pinceau')] })

  const allTokens = tokensManager.getAll()

  expect(allTokens.get('color.white').value).toEqual('#FFFFFF')
  expect(allTokens.get('color.black').value).toEqual('#191919')
}

describe('CSS Variable Manager', () => {
  test('can parse variables from css files', async () => {
    await runTest('../fixtures/css-nested')
  })
})
