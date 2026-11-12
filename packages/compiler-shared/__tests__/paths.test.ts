import { describe, expect, it } from 'vitest'
import { isPathInside } from '../src/paths'

describe('isPathInside', () => {
  it('matches posix paths on Linux and macOS', () => {
    expect(isPathInside('/proj/styled-system/css/cva.js', '/proj/styled-system')).toBe(true)
    expect(isPathInside('/proj/styled-system/css/cva.js?v=1', '/proj/styled-system/')).toBe(true)
    expect(isPathInside('/proj/styled-system', '/proj/styled-system')).toBe(true)
    expect(isPathInside('/proj/styled-system-extra/a.js', '/proj/styled-system')).toBe(false)
    expect(isPathInside('/proj/Styled-System/css/cva.js', '/proj/styled-system')).toBe(false)
  })

  it('matches Windows paths across separators and drive-letter case', () => {
    expect(isPathInside('C:/proj/styled-system/css/cva.js', 'C:\\proj\\styled-system')).toBe(true)
    expect(isPathInside('C:\\proj\\styled-system\\css\\cva.js', 'C:\\proj\\styled-system')).toBe(true)
    expect(isPathInside('C:/proj/styled-system/css/cva.js', 'c:\\proj\\styled-system')).toBe(true)
    expect(isPathInside('c:/Proj/Styled-System/css/cva.js', 'C:\\proj\\styled-system')).toBe(true)
    expect(isPathInside('C:/proj/styled-system-extra/a.js', 'C:\\proj\\styled-system')).toBe(false)
    expect(isPathInside('D:/proj/styled-system/css/cva.js', 'C:\\proj\\styled-system')).toBe(false)
  })
})
