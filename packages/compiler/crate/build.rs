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
    let Some(sysroot) = Command::new(rustc)
        .args(["--print", "sysroot"])
        .output()
        .ok()
        .filter(|out| out.status.success())
        .map(|out| String::from_utf8_lossy(&out.stdout).trim().to_string())
    else {
        return;
    };

    let crt = format!("{sysroot}/lib/rustlib/{target}/lib/self-contained/crt1-reactor.o");
    println!("cargo:rustc-link-arg={crt}");
    println!("cargo:rustc-link-arg=--export=_initialize");
}
