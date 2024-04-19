import { test, expect } from 'vitest'
import { CacheMap } from '../src/cache-map'

test('CacheMap', () => {
  const map = new CacheMap(5)

  map.set('a', '1')
  map.set('b', '2')
  map.set('c', '3')
  map.set('d', '4')
  map.set('e', '5')

  expect(map).toMatchInlineSnapshot(`
    Map {
      "a" => "1",
      "b" => "2",
      "c" => "3",
      "d" => "4",
      "e" => "5",
    }
  `)
  map.set('f', '6')

  expect(map).toMatchInlineSnapshot(`
    Map {
      "b" => "2",
      "c" => "3",
      "d" => "4",
      "e" => "5",
      "f" => "6",
    }
  `)

  map.clear()

  expect(map).toMatchInlineSnapshot(`Map {}`)
})
