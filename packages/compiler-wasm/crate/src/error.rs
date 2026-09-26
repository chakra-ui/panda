use pandacss_compiler::LoadSystemError;
use wasm_bindgen::JsValue;

pub(crate) fn load_system_error(error: LoadSystemError<JsValue>) -> JsValue {
    match error {
        LoadSystemError::Host(error) => error,
        error => JsValue::from_str(&error.message().unwrap_or_default()),
    }
}
