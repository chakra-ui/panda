use indoc::indoc;
use pandacss_codegen::{
    Block, EmitMode, Expr, FunctionDecl, ImportDecl, InterfaceDecl, Item, ItemNode, JsDoc, JsxAttr,
    JsxElement, JsxName, Module, ModuleSpecifierPolicy, Param, SourceExt, Stmt, TsType,
    TypeAliasDecl, emit_module,
};
use pandacss_config::CodegenFormat;

#[test]
fn emits_source_ts_with_runtime_and_type_items() {
    let module = cx_module();
    let output = emit_module(
        &module,
        EmitMode::SourceTs {
            ext: SourceExt::Ts,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );

    assert_eq!(
        output.source_ts.as_deref(),
        Some(
            indoc! {r"
            type Argument = string | boolean | null | undefined;

            /**
             * Conditionally join classNames into a single string
             */
            export function cx(...args: Argument[]): string {
              let str = '',
                i = 0,
                arg

              for (; i < arguments.length; ) {
                if ((arg = arguments[i++]) && typeof arg === 'string') {
                  str && (str += ' ')
                  str += arg
                }
              }
              return str
            }
            "}
            .trim()
        )
    );
}

#[test]
fn splits_runtime_and_declaration_items() {
    let module = cx_module();
    let output = emit_module(
        &module,
        EmitMode::Split {
            format: CodegenFormat::Mjs,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );

    assert_eq!(
        output.runtime.as_deref(),
        Some(
            indoc! {r"
            /**
             * Conditionally join classNames into a single string
             */
            export function cx(...args) {
              let str = '',
                i = 0,
                arg

              for (; i < arguments.length; ) {
                if ((arg = arguments[i++]) && typeof arg === 'string') {
                  str && (str += ' ')
                  str += arg
                }
              }
              return str
            }
            "}
            .trim()
        )
    );
    assert_eq!(
        output.types.as_deref(),
        Some(
            indoc! {r"
            type Argument = string | boolean | null | undefined;

            /**
             * Conditionally join classNames into a single string
             */
            export declare function cx(...args: Argument[]): string;
            "}
            .trim()
        )
    );
}

#[test]
fn emits_framework_style_jsx_ast() {
    let module = Module::new()
        .with_import(ImportDecl::value(["splitProps"], "solid-js"))
        .with_import(ImportDecl::value(["stackRaw"], "../patterns/stack"))
        .with_import(ImportDecl::value(["styled"], "./factory"))
        .with_import(ImportDecl::ty(["JSX"], "solid-js"))
        .with_item(Item::interface_decl(InterfaceDecl {
            exported: true,
            name: "StackProps".into(),
            extends: vec![TsType::Raw("StackProperties".into())],
            members: Vec::new(),
            js_doc: None,
        }))
        .with_item(Item::both(ItemNode::Function(FunctionDecl {
            exported: true,
            declare: false,
            name: "Stack".into(),
            generic_params: Vec::new(),
            params: vec![Param::typed("props", TsType::Ref("StackProps".into()))],
            return_type: Some(TsType::Raw("JSX.Element".into())),
            body: Some(Block::new(vec![
                Stmt::ConstDestructure {
                    names: vec!["patternProps".into(), "restProps".into()],
                    init: Expr::Call {
                        callee: Box::new(Expr::Ident("splitProps".into())),
                        args: vec![
                            Expr::Ident("props".into()),
                            Expr::Array(vec![
                                Expr::String("gap".into()),
                                Expr::String("direction".into()),
                            ]),
                        ],
                    },
                },
                Stmt::Const {
                    name: "styleProps".into(),
                    init: Expr::Call {
                        callee: Box::new(Expr::Ident("stackRaw".into())),
                        args: vec![Expr::Ident("patternProps".into())],
                    },
                },
                Stmt::Return(Expr::JsxElement(JsxElement {
                    name: JsxName::Member {
                        object: "styled".into(),
                        property: "div".into(),
                    },
                    attrs: vec![
                        JsxAttr::Spread("styleProps".into()),
                        JsxAttr::Spread("restProps".into()),
                    ],
                    children: Vec::new(),
                    self_closing: true,
                })),
            ])),
            js_doc: None,
        })));

    let output = emit_module(
        &module,
        EmitMode::SourceTs {
            ext: SourceExt::Tsx,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        },
    );

    assert_eq!(
        output.source_ts.as_deref(),
        Some(
            indoc! {r#"
            import { splitProps } from 'solid-js';

            import { stackRaw } from '../patterns/stack';

            import { styled } from './factory';

            import type { JSX } from 'solid-js';

            export interface StackProps extends StackProperties {}

            export function Stack(props: StackProps): JSX.Element {
              const [patternProps, restProps] = splitProps(props, ["gap", "direction"])
              const styleProps = stackRaw(patternProps)
              return <styled.div {...styleProps} {...restProps} />
            }
            "#}
            .trim()
        )
    );
}

fn cx_module() -> Module {
    Module::new()
        .with_item(Item::type_alias(TypeAliasDecl {
            exported: false,
            name: "Argument".into(),
            generic_params: Vec::new(),
            ty: TsType::Raw("string | boolean | null | undefined".into()),
            js_doc: None,
        }))
        .with_item(Item::both(ItemNode::Function(FunctionDecl {
            exported: true,
            declare: false,
            name: "cx".into(),
            generic_params: Vec::new(),
            params: vec![Param::typed("...args", TsType::Raw("Argument[]".into()))],
            return_type: Some(TsType::Ref("string".into())),
            body: Some(Block::new(vec![Stmt::Raw(
                indoc! {r"
                    let str = '',
                      i = 0,
                      arg

                    for (; i < arguments.length; ) {
                      if ((arg = arguments[i++]) && typeof arg === 'string') {
                        str && (str += ' ')
                        str += arg
                      }
                    }
                    return str
                "}
                .trim()
                .into(),
            )])),
            js_doc: Some(JsDoc {
                text: Some("Conditionally join classNames into a single string".into()),
                deprecated: None,
                default: None,
            }),
        })))
}
