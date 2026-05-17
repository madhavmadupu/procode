#[macro_use]
extern crate napi_derive;

/// Initialize NAPI-RS module
#[napi]
pub fn init() -> String {
    "procode-native initialized".to_string()
}
