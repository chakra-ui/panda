use pandacss_compiler::LoadSystemError;

pub(crate) fn load_system_error(error: LoadSystemError<napi::Error>) -> napi::Error {
    match error {
        LoadSystemError::Host(error) => error,
        error => napi::Error::from_reason(error.message().unwrap_or_default()),
    }
}
