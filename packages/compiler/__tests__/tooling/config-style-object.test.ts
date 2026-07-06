import { describe, expect, it } from 'vitest'
import { completeConfigStyleObject } from '../../src/tooling/config-style-object'
import { SpecIndex } from '../../src/tooling'
import { createProject } from '../test-utils'

function createIndex() {
  const spec = createProject({
    theme: {
      tokens: {
        colors: { red: { 500: { value: '#f00' } }, blue: { 500: { value: '#00f' } } },
      },
      keyframes: { spin: { from: {}, to: {} }, spinFast: { from: {}, to: {} } },
      breakpoints: { sm: '640px', md: '768px' },
    },
    utilities: {
      color: { className: 'c', values: 'colors', shorthand: 'c' },
      backgroundColor: { className: 'bg', values: 'colors' },
      padding: { className: 'p', values: 'colors' },
      animationName: { className: 'anim', values: 'keyframes' },
      scrollbar: { className: 'scr', values: ['visible', 'hidden'] },
    },
    conditions: { hover: '&:hover' },
  }).spec()
  return new SpecIndex(spec)
}

describe('a user starting a new property in a style object', () => {
  it('sees every utility, shorthand, and condition name they could type', () => {
    const index = createIndex()
    const names = completeConfigStyleObject(
      { existingKeys: [], cursorKind: 'key', propertyPath: [], prefix: '' },
      index,
    ).map((entry) => entry.name)

    expect(names).toEqual(expect.arrayContaining(['color', 'c', 'padding', '_hover']))
  })

  it('also sees breakpoint names (sm, md, ...) alongside named conditions', () => {
    const index = createIndex()
    const names = completeConfigStyleObject(
      { existingKeys: [], cursorKind: 'key', propertyPath: [], prefix: '' },
      index,
    ).map((entry) => entry.name)

    expect(names).toEqual(expect.arrayContaining(['sm', 'md', '_hover']))
  })

  it("doesn't see a property they've already written", () => {
    const index = createIndex()
    const names = completeConfigStyleObject(
      { existingKeys: ['color'], cursorKind: 'key', propertyPath: [], prefix: '' },
      index,
    ).map((entry) => entry.name)

    expect(names).not.toContain('color')
  })

  it("only sees names matching what they've typed so far, e.g. '_h'", () => {
    const index = createIndex()
    const names = completeConfigStyleObject(
      { existingKeys: [], cursorKind: 'key', propertyPath: [], prefix: '_h' },
      index,
    ).map((entry) => entry.name)

    expect(names).toEqual(['_hover'])
  })
})

describe('a user typing a value for a property they just picked', () => {
  it("sees matching color names, without the 'colors.' prefix, for a color property", () => {
    const index = createIndex()
    const entries = completeConfigStyleObject(
      { existingKeys: ['color'], cursorKind: 'value', propertyPath: ['color'], prefix: 're' },
      index,
    )

    // 're' also matches the CSS-wide keywords 'revert'/'revert-layer' — both are always
    // valid alongside whatever the property itself resolves to.
    expect(entries).toEqual(
      expect.arrayContaining([
        { name: 'red.500', kind: 'token' },
        { name: 'revert', kind: 'keyword' },
        { name: 'revert-layer', kind: 'keyword' },
      ]),
    )
  })

  it('also sees CSS-wide keywords like inherit/initial/unset alongside token values', () => {
    const index = createIndex()
    const names = completeConfigStyleObject(
      { existingKeys: [], cursorKind: 'value', propertyPath: ['color'], prefix: '' },
      index,
    ).map((entry) => entry.name)

    expect(names).toEqual(expect.arrayContaining(['inherit', 'initial', 'unset']))
  })

  it("sees nothing for a property Panda doesn't recognize", () => {
    const index = createIndex()
    const entries = completeConfigStyleObject(
      { existingKeys: [], cursorKind: 'value', propertyPath: ['unknownProp'], prefix: '' },
      index,
    )

    expect(entries).toEqual([])
  })

  it('sees matching keyframe names for an animationName property', () => {
    const index = createIndex()
    const entries = completeConfigStyleObject(
      { existingKeys: [], cursorKind: 'value', propertyPath: ['animationName'], prefix: 'spin' },
      index,
    )

    expect(entries).toEqual(
      expect.arrayContaining([
        { name: 'spin', kind: 'keyframe' },
        { name: 'spinFast', kind: 'keyframe' },
      ]),
    )
  })

  it('sees fixed literal values for a property with no token category, e.g. scrollbar', () => {
    const index = createIndex()
    const entries = completeConfigStyleObject(
      { existingKeys: [], cursorKind: 'value', propertyPath: ['scrollbar'], prefix: '' },
      index,
    )

    expect(entries).toEqual(
      expect.arrayContaining([
        { name: 'visible', kind: 'literal' },
        { name: 'hidden', kind: 'literal' },
      ]),
    )
  })
})

describe("a user writing a utility's own inline conditional value, e.g. backgroundColor: { sm: 're' }", () => {
  it('sees only condition/breakpoint names when starting a new key, not utility names', () => {
    const index = createIndex()
    const names = completeConfigStyleObject(
      { existingKeys: ['base'], cursorKind: 'key', propertyPath: ['backgroundColor'], prefix: '' },
      index,
    ).map((entry) => entry.name)

    expect(names).toEqual(expect.arrayContaining(['sm', 'md', '_hover']))
    expect(names).not.toContain('color')
    expect(names).not.toContain('base')
  })

  it("sees the outer property's own values while typing one of the conditional value's entries", () => {
    const index = createIndex()
    const entries = completeConfigStyleObject(
      { existingKeys: ['base'], cursorKind: 'value', propertyPath: ['backgroundColor', 'sm'], prefix: 're' },
      index,
    )

    expect(entries).toEqual(expect.arrayContaining([{ name: 'red.500', kind: 'token' }]))
  })

  it('resolves the same way for an array conditional value, e.g. backgroundColor: [..., "re"]', () => {
    const index = createIndex()
    const entries = completeConfigStyleObject(
      { existingKeys: [], cursorKind: 'value', propertyPath: ['backgroundColor'], prefix: 're' },
      index,
    )

    expect(entries).toEqual(expect.arrayContaining([{ name: 'red.500', kind: 'token' }]))
  })

  it('still resolves the outer property when the conditional value nests, e.g. sm: { md: "re" }', () => {
    const index = createIndex()
    const entries = completeConfigStyleObject(
      {
        existingKeys: [],
        cursorKind: 'value',
        propertyPath: ['backgroundColor', 'sm', 'md'],
        prefix: 're',
      },
      index,
    )

    expect(entries).toEqual(expect.arrayContaining([{ name: 'red.500', kind: 'token' }]))
  })
})
