use pandacss_config::UserConfig;

#[test]
fn scan_exclude_appends_outdir_and_default_dts() {
    let config = UserConfig {
        outdir: "styled-system".into(),
        ..Default::default()
    };

    assert_eq!(
        config.scan_exclude(),
        vec!["styled-system/**".to_owned(), "**/*.d.ts".to_owned()]
    );
}

#[test]
fn scan_exclude_preserves_user_excludes() {
    let config = UserConfig {
        exclude: vec!["dist/**".to_owned()],
        outdir: "styled-system".into(),
        ..Default::default()
    };

    assert_eq!(
        config.scan_exclude(),
        vec![
            "dist/**".to_owned(),
            "styled-system/**".to_owned(),
            "**/*.d.ts".to_owned()
        ]
    );
}

#[test]
fn scan_exclude_skips_duplicate_outdir_glob() {
    let config = UserConfig {
        exclude: vec!["styled-system/**".to_owned()],
        outdir: "styled-system".into(),
        ..Default::default()
    };

    assert_eq!(
        config.scan_exclude(),
        vec!["styled-system/**".to_owned(), "**/*.d.ts".to_owned()]
    );
}

#[test]
fn scan_exclude_recognizes_broad_outdir_exclude() {
    let config = UserConfig {
        exclude: vec!["**/styled-system/**".to_owned()],
        outdir: "styled-system".into(),
        ..Default::default()
    };

    assert_eq!(
        config.scan_exclude(),
        vec!["**/styled-system/**".to_owned(), "**/*.d.ts".to_owned()]
    );
}
