import assert from 'assert'
import data from './styles.json' assert { type: 'json' }

assert.equal(data.css.length, 1)
assert.equal(data.recipe.button.length, 1)

assert.equal(data.css[0].data[0].color, 'red.100')
assert.equal(data.recipe.button[0].data[0].visual, 'solid')
