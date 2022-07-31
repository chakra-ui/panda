import { describe, expect, test } from 'vitest';
import { generate, run } from '../src/generate';

describe('generate stylesheet', () => {
  test('should work with basic', () => {
    expect(run(generate({ bg: 'red.300' }))).toMatchInlineSnapshot(`
      ".bg\\\\:red\\\\.300 {
          bg: red.300
      }"
    `);
  });

  test('should work with inner responsive', () => {
    expect(
      run(
        generate({
          ml: { ltr: { sm: '4' }, rtl: '-4' },
        })
      )
    ).toMatchInlineSnapshot(`
      "@screen sm {
          [dir=ltr] .ltr\\\\:sm\\\\:ml\\\\:4 {
              ml: 4
          }
      }
      [dir=rtl] .rtl\\\\:ml\\\\:-4 {
          ml: -4
      }"
    `);
  });

  test('respect color mode', () => {
    expect(
      run(
        generate({
          color: { light: 'red', dark: 'green' },
          opacity: { dark: 'slate400' },
        })
      )
    ).toMatchInlineSnapshot(`
      ".light .light\\\\:color\\\\:red {
          color: red
      }
      .dark .dark\\\\:color\\\\:green {
          color: green
      }
      .dark .dark\\\\:opacity\\\\:slate400 {
          opacity: slate400
      }"
    `);
  });

  test('should work with outer responsive', () => {
    expect(
      run(
        generate({
          top: { sm: { rtl: '20px', hover: '50px' }, lg: '120px' },
        })
      )
    ).toMatchInlineSnapshot(`
      "@screen sm {
          [dir=rtl] .sm\\\\:rtl\\\\:top\\\\:20px {
              top: 20px
          }
      }
      @screen sm {
          .sm\\\\:hover\\\\:top\\\\:50px:hover {
              top: 50px
          }
      }
      @screen lg {
          .lg\\\\:top\\\\:120px {
              top: 120px
          }
      }"
    `);
  });

  test('should skip `_` notation', () => {
    expect(
      run(
        generate({
          left: { _: '20px', md: '40px' },
        })
      )
    ).toMatchInlineSnapshot(`
      ".left\\\\:20px {
          left: 20px
      }
      @screen md {
          .md\\\\:left\\\\:40px {
              left: 40px
          }
      }"
    `);
  });

  test('should work with nested selector', () => {
    expect(
      run(
        generate({
          left: { _: '20px', md: '40px' },
        })
      )
    ).toMatchInlineSnapshot(`
      ".left\\\\:20px {
          left: 20px
      }
      @screen md {
          .md\\\\:left\\\\:40px {
              left: 40px
          }
      }"
    `);
  });
});
