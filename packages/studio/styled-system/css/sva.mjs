import { getSlotRecipes, memo, splitProps } from '../helpers.mjs';
import { cva } from './cva.mjs';
import { cx } from './cx.mjs';

const slotClass = (className, slot) => className + '__' + slot

export function sva(config) {
  const slots = Object.entries(getSlotRecipes(config)).map(([slot, slotCva]) => [slot, cva(slotCva)])

  function svaFn(props) {
    const result = slots.map(([slot, cvaFn]) => [slot, cx(cvaFn(props), config.className && slotClass(config.className, slot))])
    return Object.fromEntries(result)
  }

  function raw(props) {
    const result = slots.map(([slot, cvaFn]) => [slot, cvaFn.raw(props)])
    return Object.fromEntries(result)
  }

  const variants = config.variants ?? {};
  const variantKeys = Object.keys(variants);

  function splitVariantProps(props) {
    return splitProps(props, variantKeys);
  }

  const variantMap = Object.fromEntries(
    Object.entries(variants).map(([key, value]) => [key, Object.keys(value)])
  );

  return Object.assign(memo(svaFn), {
    __cva__: false,
    raw,
    variantMap,
    variantKeys,
    splitVariantProps,
  })
}