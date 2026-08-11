//! Folding `styled()` component chains to their intrinsic tag.

use super::common::transform_jsx;
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn element_props_win_over_the_chain_base() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        const Button = styled('button', { base: { color: 'red' } });
        export const el = <Button color="blue" type="submit" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    const Button = styled('button', __pcva({ base: 'color_red' }));
    export const el = <button type="submit" className="color_blue" />;
    "#);
}

#[test]
fn an_alias_of_a_folded_chain_still_folds() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        const Button = styled('button', { base: { color: 'red' } });
        const Alias = Button;
        export const el = <Alias />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    const Button = styled('button', __pcva({ base: 'color_red' }));
    const Alias = Button;
    export const el = <button className="color_red" />;
    "#);
}

#[test]
fn folds_a_styled_definition_to_its_intrinsic_tag() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        const Button = styled('button', { base: { color: 'red' } });
        export const el = <Button>hi</Button>;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    const Button = styled('button', __pcva({ base: 'color_red' }));
    export const el = <button className="color_red">hi</button>;
    "#);
}

#[test]
fn folds_a_multi_level_chain_with_the_outermost_level_winning() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        const L0 = styled('button', { base: { color: 'red', margin: '0' } });
        const L1 = styled(L0, { base: { color: 'blue' } });
        const L2 = styled(L1, { base: { color: 'green' } });
        export const el = <L2>hi</L2>;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    const L0 = styled('button', __pcva({ base: 'color_red margin_0' }));
    const L1 = styled(L0, { base: { color: 'blue' } });
    const L2 = styled(L1, { base: { color: 'green' } });
    export const el = <button className="color_green margin_0">hi</button>;
    "#);
}

#[test]
fn the_as_prop_retargets_a_folded_chain() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        const Button = styled('button', { base: { color: 'red' } });
        export const el = <Button as="a" href="/home" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    import { cva as __pcva } from '@pandacss-internal/css';
    import { styled } from '@panda/jsx';
    const Button = styled('button', __pcva({ base: 'color_red' }));
    export const el = <a href="/home" className="color_red" />;
    "#);
}

#[test]
fn a_chain_defined_inside_a_function_is_not_folded() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        export function App() {
          const Button = styled('button', { base: { color: 'red' } });
          return <Button />;
        }
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.code.contains(r#"<Button />"#), "{}", output.code);
}

#[test]
fn a_non_local_base_component_blocks_the_chain_fold() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        import { Other } from './other';
        const Button = styled(Other, { base: { color: 'red' } });
        export const el = <Button />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.code.contains(r#"<Button />"#), "{}", output.code);
}

#[test]
fn a_rebindable_let_declaration_blocks_the_chain_fold() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        let Button = styled('button', { base: { color: 'red' } });
        export const el = <Button />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.code.contains(r#"<Button />"#), "{}", output.code);
}

#[test]
fn an_options_argument_blocks_the_chain_fold() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        const Button = styled('button', { base: { color: 'red' } }, { defaultProps: { type: 'submit' } });
        export const el = <Button />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(output.code.contains(r#"<Button />"#), "{}", output.code);
}

#[test]
fn variants_block_the_chain_fold() {
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        const Button = styled('button', {
          base: { color: 'red' },
          variants: { size: { sm: { padding: '4px' } } },
        });
        export const el = <Button size="sm" />;
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(
        output.code.contains(r#"<Button size="sm" />"#),
        "{}",
        output.code
    );
}

#[test]
fn a_local_binding_shadowing_a_folded_chain_is_left_alone() {
    // The inner `Button` is an ordinary component, so folding it to the outer
    // chain's `<button>` would render the wrong element with the wrong styles.
    let source = indoc! {r#"
        import { styled } from '@panda/jsx';
        const Button = styled('button', { base: { color: 'red' } });
        export const Link = () => {
          const Button = (props) => <a {...props} />;
          return <Button href="/go">go</Button>;
        };
    "#};

    let output = transform_jsx("src/app.tsx", source);

    assert!(
        !output.code.contains("<button"),
        "shadowed component must not fold to the chain's tag: {}",
        output.code
    );
    // the element keeps its own identity and gains no class from the chain
    assert!(
        output.code.contains(r#"<Button href="/go">go</Button>"#),
        "shadowed element should be untouched: {}",
        output.code
    );
}
