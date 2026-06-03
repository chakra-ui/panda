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
    assert_eq!(paths.join(&["/project", "/tmp/styled-system"]), "/tmp/styled-system");
    assert_eq!(
        paths.join(&["/project//", "./styled-system", "css/../styles.css"]),
        "/project/styled-system/styles.css"
    );
    assert_eq!(paths.join(&["/project", "../../styles.css"]), "/styles.css");
    assert_eq!(paths.join(&["project", "../styles.css"]), "styles.css");
    assert_eq!(paths.join(&["project", "../../styles.css"]), "../styles.css");
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
    let cwd = std::env::current_dir().unwrap();
    let cwd = cwd.to_string_lossy();

    assert_eq!(
        paths.resolve(&cwd, "styled-system"),
        std::path::Path::new(cwd.as_ref())
            .join("styled-system")
            .to_string_lossy()
            .into_owned()
    );
    assert_eq!(
        paths.join(&[cwd.as_ref(), "styled-system", "css"]),
        std::path::Path::new(cwd.as_ref())
            .join("styled-system")
            .join("css")
            .to_string_lossy()
            .into_owned()
    );
}
