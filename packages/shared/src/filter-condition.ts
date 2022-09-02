/* -----------------------------------------------------------------------------
 * Filter default conditions
 * -----------------------------------------------------------------------------*/

export function filterBaseConditions(conditions: string[]) {
  return conditions.slice().filter((v) => !/^(base|_)$/.test(v))
}
