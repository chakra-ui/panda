use std::collections::BTreeMap;

use pandacss_config::VariantTypeData;

use crate::{ImportDecl, Item, ItemNode, Module};

pub(super) fn module() -> Module {
    Module::new()
        .with_import(ImportDecl::ty(
            ["ConditionalValue", "SystemStyleObject"],
            "./system",
        ))
        .with_item(type_raw(RECIPE_TYPES))
}

const RECIPE_TYPES: &str = r"export type RecipeVariantProps<T> = T extends (props?: infer Props) => unknown ? Props : never

export type RecipeVariant<T> = Required<NonNullable<RecipeVariantProps<T>>>

export type RecipeVariantMap<Variant extends object> = {
  [K in keyof Variant]-?: Array<Variant[K]>
}

export type RecipeConfigVariantMap<T> = {
  [K in keyof T]: Array<keyof T[K]>
}

export interface RecipeRuntimeFn<Props extends object = object, Map extends object = object> {
  (props?: Props): string
  __type: Props
  variantMap: Map
  variantKeys: Array<keyof Props>
  raw: (props?: Props) => SystemStyleObject
  splitVariantProps<T extends Record<string, any>>(props: T): [Props, Omit<T, keyof Props>]
  getVariantProps: (props?: Props) => Props
  merge(recipe: RecipeRuntimeFn): RecipeRuntimeFn
}

export type SlotRecord<Slot extends string, Value> = Partial<Record<Slot, Value>>

export interface SlotRecipeRuntimeFn<Slot extends string, Props extends object = object, Map extends object = object> {
  (props?: Props): SlotRecord<Slot, string>
  __type: Props
  __slot: Slot
  variantMap: Map
  variantKeys: Array<keyof Props>
  raw: (props?: Props) => Record<Slot, SystemStyleObject>
  splitVariantProps<T extends Record<string, any>>(props: T): [Props, Omit<T, keyof Props>]
  getVariantProps: (props?: Props) => Props
}

export type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

export type RecipeVariantRecord = Record<string, Record<string, SystemStyleObject>>

export type RecipeSelection<T extends RecipeVariantRecord> = {
  [K in keyof T]?: StringToBoolean<keyof T[K]>
}

export type RecipeCompoundSelection<T> = {
  [K in keyof T]?: StringToBoolean<keyof T[K]> | Array<StringToBoolean<keyof T[K]>>
}

export interface RecipeDefinition<T extends RecipeVariantRecord = RecipeVariantRecord> {
  base?: SystemStyleObject
  variants?: T
  defaultVariants?: RecipeSelection<T>
  compoundVariants?: Array<RecipeCompoundSelection<T> & { css: SystemStyleObject }>
}

export interface RecipeCreatorFn {
  <T extends RecipeVariantRecord>(config: RecipeDefinition<T>): RecipeRuntimeFn<RecipeSelection<T>, RecipeConfigVariantMap<T>>
}

export type SlotRecipeVariantRecord<Slot extends string> = Record<string, Record<string, SlotRecord<Slot, SystemStyleObject>>>

export interface SlotRecipeDefinition<Slot extends string = string, T extends SlotRecipeVariantRecord<Slot> = SlotRecipeVariantRecord<Slot>> {
  className?: string
  slots: Slot[]
  base?: SlotRecord<Slot, SystemStyleObject>
  variants?: T
  defaultVariants?: RecipeSelection<T>
  compoundVariants?: Array<RecipeCompoundSelection<T> & { css: SlotRecord<Slot, SystemStyleObject> }>
}

export interface SlotRecipeCreatorFn {
  <Slot extends string, T extends SlotRecipeVariantRecord<Slot>>(config: SlotRecipeDefinition<Slot, T>): SlotRecipeRuntimeFn<Slot, RecipeSelection<T>, RecipeConfigVariantMap<T>>
}";

pub(crate) fn concrete_recipe_types(
    type_name: &str,
    slots: Option<&[String]>,
    variants: &BTreeMap<String, VariantTypeData>,
    has_compound_variants: bool,
) -> Vec<String> {
    let variant_name = format!("{type_name}Variant");
    let props_name = format!("{type_name}VariantProps");
    let map_name = format!("{type_name}VariantMap");
    let mut out = vec![
        variant_type(&variant_name, variants),
        variant_props_type(&props_name, &variant_name, has_compound_variants),
        variant_map_type(&map_name, &variant_name),
    ];

    if let Some(slots) = slots {
        let slot_name = format!("{type_name}Slot");
        out.push(format!(
            "export type {slot_name} = {}",
            string_union(slots, "string")
        ));
        out.push(format!(
            "export type {type_name}Recipe = SlotRecipeRuntimeFn<{slot_name}, {props_name}, {map_name}>"
        ));
    } else {
        out.push(format!(
            "export type {type_name}Recipe = RecipeRuntimeFn<{props_name}, {map_name}>"
        ));
    }

    out
}

fn variant_type(type_name: &str, variants: &BTreeMap<String, VariantTypeData>) -> String {
    if variants.is_empty() {
        return format!("export type {type_name} = {{}}");
    }

    let members = variants
        .iter()
        .map(|(name, data)| format!("  {}?: {}", quote_member(name), variant_value_type(data)))
        .collect::<Vec<_>>()
        .join("\n");

    format!("export type {type_name} = {{\n{members}\n}}")
}

fn variant_props_type(props_name: &str, variant_name: &str, has_compound_variants: bool) -> String {
    // The runtime rejects conditional variant values when compound variants
    // exist, so the props type drops the ConditionalValue wrapper too.
    if has_compound_variants {
        return format!(
            "export type {props_name} = {{\n  [K in keyof {variant_name}]?: {variant_name}[K]\n}}"
        );
    }
    format!(
        "export type {props_name} = {{\n  [K in keyof {variant_name}]?: ConditionalValue<{variant_name}[K]>\n}}"
    )
}

fn variant_map_type(map_name: &str, variant_name: &str) -> String {
    format!("export type {map_name} = RecipeVariantMap<{variant_name}>")
}

fn variant_value_type(data: &VariantTypeData) -> String {
    let mut parts = Vec::with_capacity(data.values.len() + usize::from(data.allows_boolean));

    if data.allows_boolean {
        parts.push("boolean".to_owned());
    }

    parts.extend(
        data.values
            .iter()
            .filter(|value| !(data.allows_boolean && (*value == "true" || *value == "false")))
            .map(|value| string_literal(value)),
    );

    if parts.is_empty() {
        "string".into()
    } else {
        parts.join(" | ")
    }
}

fn string_union(values: &[String], fallback: &str) -> String {
    if values.is_empty() {
        return fallback.into();
    }

    values
        .iter()
        .map(|value| string_literal(value))
        .collect::<Vec<_>>()
        .join(" | ")
}

fn quote_member(value: &str) -> String {
    if is_identifier(value) {
        value.into()
    } else {
        string_literal(value)
    }
}

fn string_literal(value: &str) -> String {
    format!("{value:?}")
}

fn is_identifier(value: &str) -> bool {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    (first.is_ascii_alphabetic() || first == '_' || first == '$')
        && chars.all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '$')
}

fn type_raw(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}
