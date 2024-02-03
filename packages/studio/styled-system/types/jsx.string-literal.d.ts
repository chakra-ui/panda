/* eslint-disable */
import type { ComponentPropsWithoutRef, ElementType, ElementRef, Ref } from 'react'
import type { DistributiveOmit } from '../types/system-types';

interface Dict {
  [k: string]: unknown
}

export type ComponentProps<T extends ElementType> = DistributiveOmit<ComponentPropsWithoutRef<T>, 'ref'> & {
  ref?: Ref<ElementRef<T>>
}

export type XPandaComponent<T extends ElementType> = {
  (args: { raw: readonly string[] | ArrayLike<string> }): (props: ComponentProps<T>) => JSX.Element
  displayName?: string
}

export interface JsxFactory {
  <T extends ElementType>(component: T): XPandaComponent<T>
}

export type JsxElements = {
  [K in keyof JSX.IntrinsicElements]: XPandaComponent<K>
}

export type XPanda = JsxFactory & JsxElements

export type XHTMLPandaProps<T extends ElementType> = ComponentProps<T>