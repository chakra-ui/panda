use pandacss_config::UserConfig;
use serde_json::json;

fn config_with_scales() -> UserConfig {
    serde_json::from_value(json!({
        "theme": {
            "breakpoints": {
                "sm": "640px",
                "md": "768px",
                "lg": "1024px"
            },
            "containers": {
                "xs": "20rem",
                "sm": "24rem",
                "md": "28rem"
            },
            "containerNames": ["pb"]
        }
    }))
    .expect("valid typed config")
}

#[test]
fn a_container_condition_resolves_to_its_query() {
    let config = config_with_scales();

    assert_eq!(
        config.container_condition("@pb/sm").as_deref(),
        Some("@container pb (inline-size >= 24rem)")
    );
    assert_eq!(
        config.container_condition("@/smToMd").as_deref(),
        Some("@container (inline-size >= 24rem) and (inline-size < 28rem)")
    );
}

#[test]
fn a_breakpoint_condition_resolves_to_its_query() {
    let config = config_with_scales();

    assert_eq!(
        config.breakpoint_condition("md").as_deref(),
        Some("@media (width >= 48rem)")
    );
    assert_eq!(
        config.breakpoint_condition("smToMd").as_deref(),
        Some("@media (width >= 40rem) and (width < 48rem)")
    );
}

#[test]
fn unknown_condition_keys_stay_unresolved() {
    let config = config_with_scales();

    assert_eq!(config.container_condition("@pb/nope"), None);
    assert_eq!(config.breakpoint_condition("nope"), None);
}

#[test]
fn a_theme_without_containers_resolves_no_container_conditions() {
    let config: UserConfig = serde_json::from_value(json!({
        "theme": { "breakpoints": { "sm": "640px" } }
    }))
    .expect("valid typed config");

    assert_eq!(config.container_condition("@pb/sm"), None);
    assert_eq!(config.container_condition("@/sm"), None);
}

#[test]
fn a_cloned_config_resolves_the_same_conditions() {
    let config = config_with_scales();
    let cloned = config.clone();

    assert_eq!(
        cloned.container_condition("@pb/sm"),
        config.container_condition("@pb/sm")
    );
    assert_eq!(
        cloned.breakpoint_condition("md"),
        config.breakpoint_condition("md")
    );
}

#[test]
fn a_default_config_resolves_no_conditions() {
    let config = UserConfig::default();

    assert_eq!(config.container_condition("@pb/sm"), None);
    assert_eq!(config.breakpoint_condition("md"), None);
    assert!(config.theme.container_conditions().is_empty());
}

const _: fn() = || {
    fn assert_send_sync<T: Send + Sync>() {}
    assert_send_sync::<UserConfig>();
};
