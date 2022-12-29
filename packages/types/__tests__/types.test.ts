import { describe, expect, test } from 'vitest'
import type { StyleObject } from '../src'
import type { Conditions } from './conditions'
import type { PropTypes } from './prop-types'

type SystemStyleObject = StyleObject<Conditions, PropTypes, false, {}>

describe('csstype', () => {
  test('should have no type error', () => {
    const styles: SystemStyleObject = {
      gap: '40px',
      background: 'red.200',
      accentColor: 'ButtonHighlight',
      color: { sm: 'red.200', md: 'yellow.800' },
      borderBlock: 'red',
      margin: '7',
      paddingBlock: '7',
      outlineColor: 'rose.200',
      display: 'flex',
      alignItems: 'center',
      marginTop: '10',
      md: {
        display: 'none',
        position: 'absolute',
        padding: '4',
        top: '6',
        left: '-36',
        sm: {
          color: 'red.400',
          marginTop: 'revert',
          marginBottom: 'inherit',
          accentColor: 'rose.200',
          margin: '8',
          padding: '7',
        },
        '&.a': {
          color: 'red.400',
        },
        'svg &': {
          margin: 'initial',
          _light: {
            color: 'red.400',
          },
        },
      },
    }

    const keys: keyof SystemStyleObject = 'alignItems'

    expect(styles).toBeTruthy()
    expect(keys).toBeTruthy()
  })
})
