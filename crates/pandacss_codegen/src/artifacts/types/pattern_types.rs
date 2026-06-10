use crate::{ImportDecl, Item, ItemNode, Module};

pub(super) fn module() -> Module {
    Module::new()
        .with_import(ImportDecl::ty(
            [
                "ConditionalValue",
                "SystemProperties",
                "SystemStyleObject",
            ],
            "./system",
        ))
        .with_item(type_raw(
            r"export type PatternPrimitive = string | number | boolean

export type PatternPropertyValue<Property extends keyof SystemProperties> = SystemProperties[Property]

export type PatternTokenValue<Value> = ConditionalValue<Value>

export interface PatternHelpers {
  map(value: unknown, fn: (value: string) => string | undefined): unknown
  isCssUnit(value: unknown): boolean
  isCssVar(value: unknown): boolean
  isCssFunction(value: unknown): boolean
}

export interface PatternConfig<Props extends object = object> {
  properties?: Props
  defaultValues?: Partial<Props> | ((props: Props) => Partial<Props>)
  transform?: (props: Props, helpers: PatternHelpers) => SystemStyleObject
  strict?: boolean
  blocklist?: Array<keyof SystemProperties>
}

export interface PatternRuntimeConfig<Props extends object = object> extends PatternConfig<Props> {
  transform: (props: Props, helpers: PatternHelpers) => SystemStyleObject
}",
        ))
}

fn type_raw(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}
