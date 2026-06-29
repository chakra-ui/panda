use std::process::Command;

fn main() {
    napi_build::setup();
    link_wasi_reactor();
}

fn link_wasi_reactor() {
    let target = std::env::var("TARGET").unwrap_or_default();
    if !target.starts_with("wasm32-wasi") {
        return;
    }

    let rustc = std::env::var("RUSTC").unwrap_or_else(|_| "rustc".into());
    let output = Command::new(rustc)
        .args(["--print", "sysroot"])
        .output()
        .expect("failed to run `rustc --print sysroot`");
    assert!(output.status.success(), "`rustc --print sysroot` failed");
    let sysroot = String::from_utf8_lossy(&output.stdout).trim().to_string();

    let crt = format!("{sysroot}/lib/rustlib/{target}/lib/self-contained/crt1-reactor.o");
    assert!(
        std::path::Path::new(&crt).exists(),
        "missing {crt}: the reactor crt is required so the module runs its constructors under the emnapi loader"
    );
    cargo_link_arg("--allow-multiple-definition");
    cargo_link_arg(&crt);
    cargo_link_arg("--export=_initialize");
}

#[expect(
    clippy::disallowed_macros,
    reason = "Cargo build scripts emit instructions to Cargo through stdout"
)]
fn cargo_link_arg(arg: &str) {
    println!("cargo:rustc-link-arg={arg}");
}
