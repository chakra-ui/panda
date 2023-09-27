import assert from 'assert'
import data from './styles.json' assert { type: 'json' }

assert.equal(data.css.length, 1)
assert.equal(data.cva.length, 1)
assert.equal(Object.keys(data.recipe).length, 2)
assert.equal(data.recipe.button.length, 1)
assert.equal(data.recipe.card.length, 1)
assert.equal(Object.keys(data.pattern).length, 1)
assert.equal(data.pattern.flex.length, 1)

assert.equal(data.css[0].data[0].color, 'red.100')
assert.equal(data.cva[0].data[0].base.border, 'none')
assert.equal(data.recipe.button[0].data[0].visual, 'solid')
assert.equal(data.recipe.card[0].type, 'recipe')
assert.equal(data.pattern.flex[0].data[0].direction, 'row')
