//! `styled('tag', config)` and `styled.tag(config)` factory call transforms.

use pandacss_extractor::{ExtractedCall, Literal, MatchCategory};
use pandacss_project::Project;

use crate::plan::Rewrite;
use crate::recipe_inline::rewrite_styled_config_arg;

pub(crate) fn rewrite_for_styled_call(
    project: &Project,
    source: &str,
    call: &ExtractedCall,
) -> Option<Rewrite> {
    if call.category != MatchCategory::Jsx || call.jsx_recipe_ident.is_some() {
        return None;
    }
    if !is_jsx_factory_call(call) {
        return None;
    }

    let (config_index, config) = styled_config_arg(call)?;
    rewrite_styled_config_arg(project, source, call.span, config_index, config)
}

fn is_jsx_factory_call(call: &ExtractedCall) -> bool {
    call.name == call.alias || call.name.starts_with(&format!("{}.", call.alias))
}

fn styled_config_arg(call: &ExtractedCall) -> Option<(usize, &Literal)> {
    if call.name == call.alias {
        let tag = call.data.first().and_then(|arg| arg.as_ref())?;
        if !matches!(tag, Literal::String(_)) {
            return None;
        }
        let config = call.data.get(1).and_then(|arg| arg.as_ref())?;
        return Some((1, config));
    }

    if call.name.starts_with(&format!("{}.", call.alias)) {
        let config = call.data.first().and_then(|arg| arg.as_ref())?;
        return Some((0, config));
    }

    None
}
