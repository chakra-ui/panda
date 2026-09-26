use std::path::Path;

use pandacss_fs::{
    OsPathSystem, PathSystem, PosixPathSystem, normalize_glob_pattern, normalize_lexical,
    to_forward_slash,
};

#[test]
fn posix_path_system_resolves_and_joins() {
    let paths = PosixPathSystem;

    assert!(paths.is_absolute("/project/src"));
    assert!(!paths.is_absolute("src"));
    assert_eq!(
        paths.join(&["/project", "styled-system", "css"]),
        "/project/styled-system/css"
    );
    assert_eq!(paths.join(&["/"]), "/");
    assert_eq!(paths.join(&["/", "styles.css"]), "/styles.css");
    assert_eq!(
        paths.join(&["/project", "/tmp/styled-system"]),
        "/tmp/styled-system"
    );
    assert_eq!(
        paths.join(&["/project//", "./styled-system", "css/../styles.css"]),
        "/project/styled-system/styles.css"
    );
    assert_eq!(paths.join(&["/project", "../../styles.css"]), "/styles.css");
    assert_eq!(paths.join(&["project", "../styles.css"]), "styles.css");
    assert_eq!(
        paths.join(&["project", "../../styles.css"]),
        "../styles.css"
    );
    assert_eq!(paths.dirname("/"), "/");
    assert_eq!(
        paths.dirname("/project/styled-system/styles.css"),
        "/project/styled-system"
    );
    assert_eq!(
        paths.resolve("/project", "styled-system"),
        "/project/styled-system"
    );
    assert_eq!(
        paths.resolve("/project", "/tmp/styled-system"),
        "/tmp/styled-system"
    );
}

#[test]
fn os_path_system_resolves_and_joins() {
    let paths = OsPathSystem;
    let root = std::path::Path::new("project");
    let cwd = root.to_string_lossy();

    assert_eq!(
        paths.resolve(&cwd, "styled-system"),
        root.join("styled-system").to_string_lossy().into_owned()
    );
    assert_eq!(
        paths.join(&[cwd.as_ref(), "styled-system", "css"]),
        root.join("styled-system")
            .join("css")
            .to_string_lossy()
            .into_owned()
    );
}

#[test]
fn safe_relative_paths_reject_root_escape_on_every_host() {
    for paths in [
        &OsPathSystem as &dyn PathSystem,
        &PosixPathSystem as &dyn PathSystem,
    ] {
        assert!(paths.is_safe_relative("styles/recipes/button.css"));
        assert!(!paths.is_safe_relative("../outside.css"));
        assert!(!paths.is_safe_relative("styles/../../outside.css"));
        assert!(!paths.is_safe_relative("styles\\..\\outside.css"));
        assert!(!paths.is_safe_relative("/tmp/outside.css"));
        assert!(!paths.is_safe_relative("C:\\tmp\\outside.css"));
    }
}

#[test]
fn windows_separators_become_forward_slashes() {
    assert_eq!(
        to_forward_slash(Path::new(r"C:\project\src\App.tsx")),
        "C:/project/src/App.tsx"
    );
}

#[test]
fn forward_slash_paths_are_left_alone() {
    assert_eq!(
        to_forward_slash(Path::new("/project/src/App.tsx")),
        "/project/src/App.tsx"
    );
}

#[test]
fn lexical_normalize_resolves_dot_segments_inside_the_path() {
    assert_eq!(
        normalize_lexical(Path::new("src/components/./../utils/x.ts")),
        "src/utils/x.ts"
    );
}

#[test]
fn lexical_normalize_keeps_a_leading_parent_segment() {
    assert_eq!(
        normalize_lexical(Path::new("components/../../shared/x")),
        "../shared/x"
    );
}

#[test]
fn lexical_normalize_stops_parent_segments_at_the_root() {
    assert_eq!(normalize_lexical(Path::new("/project/../../x")), "/x");
}

#[test]
fn lexical_normalize_handles_windows_separators() {
    assert_eq!(
        normalize_lexical(Path::new(r"src\components\..\utils\x.ts")),
        "src/utils/x.ts"
    );
}

#[test]
fn glob_pattern_loses_a_leading_current_dir_prefix() {
    assert_eq!(normalize_glob_pattern("./src/**/*.tsx"), "src/**/*.tsx");
}

#[test]
fn glob_pattern_outside_cwd_is_left_alone() {
    assert_eq!(normalize_glob_pattern("../shared/**"), "../shared/**");
}
