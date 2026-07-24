use pandacss_fs::{OsPathSystem, PathSystem, PosixPathSystem};

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
