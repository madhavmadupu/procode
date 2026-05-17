#[macro_use]
extern crate napi_derive;

use napi::Result;
use procode_git::*;

/// Initialize NAPI-RS module
#[napi]
pub fn init() -> String {
    "procode-native initialized".to_string()
}

// Git status
#[napi]
pub fn git_status(repo_path: String) -> Result<String> {
    let status = procode_git::git_status(&repo_path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&status).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git stage
#[napi]
pub fn git_stage(repo_path: String, paths: Vec<String>) -> Result<()> {
    procode_git::git_stage(&repo_path, paths).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git unstage
#[napi]
pub fn git_unstage(repo_path: String, paths: Vec<String>) -> Result<()> {
    procode_git::git_unstage(&repo_path, paths).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git discard
#[napi]
pub fn git_discard(repo_path: String, paths: Vec<String>) -> Result<()> {
    procode_git::git_discard(&repo_path, paths).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git diff unstaged
#[napi]
pub fn git_diff_unstaged(repo_path: String, path: String) -> Result<String> {
    let diff = procode_git::git_diff_unstaged(&repo_path, &path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&diff).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git diff staged
#[napi]
pub fn git_diff_staged(repo_path: String, path: String) -> Result<String> {
    let diff = procode_git::git_diff_staged(&repo_path, &path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&diff).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git diff commits
#[napi]
pub fn git_diff_commits(repo_path: String, from: String, to: String) -> Result<String> {
    let diff = procode_git::git_diff_commits(&repo_path, &from, &to).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&diff).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git commit
#[napi]
pub fn git_commit(repo_path: String, message: String, sign_off: bool) -> Result<String> {
    procode_git::git_commit(&repo_path, &message, sign_off).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git amend
#[napi]
pub fn git_amend(repo_path: String, message: Option<String>) -> Result<String> {
    procode_git::git_amend(&repo_path, message.as_deref()).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git branch list
#[napi]
pub fn git_branch_list(repo_path: String) -> Result<String> {
    let branches = procode_git::git_branch_list(&repo_path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&branches).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git branch create
#[napi]
pub fn git_branch_create(repo_path: String, name: String, from: Option<String>) -> Result<()> {
    procode_git::git_branch_create(&repo_path, &name, from.as_deref()).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git branch checkout
#[napi]
pub fn git_branch_checkout(repo_path: String, name: String) -> Result<()> {
    procode_git::git_branch_checkout(&repo_path, &name).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git branch delete
#[napi]
pub fn git_branch_delete(repo_path: String, name: String, force: bool) -> Result<()> {
    procode_git::git_branch_delete(&repo_path, &name, force).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git branch current
#[napi]
pub fn git_branch_current(repo_path: String) -> Result<String> {
    procode_git::git_branch_current(&repo_path).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git blame
#[napi]
pub fn git_blame(repo_path: String, path: String) -> Result<String> {
    let blame = procode_git::git_blame(&repo_path, &path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&blame).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git log
#[napi]
pub fn git_log(repo_path: String, limit: u32, path: Option<String>) -> Result<String> {
    let log = procode_git::git_log(&repo_path, limit, path.as_deref()).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&log).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git fetch
#[napi]
pub fn git_fetch(repo_path: String, remote: Option<String>) -> Result<()> {
    procode_git::git_fetch(&repo_path, remote.as_deref()).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git pull
#[napi]
pub fn git_pull(repo_path: String) -> Result<String> {
    let result = procode_git::git_pull(&repo_path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&result).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git push
#[napi]
pub fn git_push(repo_path: String, remote: String, branch: String) -> Result<()> {
    procode_git::git_push(&repo_path, &remote, &branch).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git remote list
#[napi]
pub fn git_remote_list(repo_path: String) -> Result<String> {
    let remotes = procode_git::git_remote_list(&repo_path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&remotes).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git stash push
#[napi]
pub fn git_stash_push(repo_path: String, message: Option<String>) -> Result<()> {
    procode_git::git_stash_push(&repo_path, message.as_deref()).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git stash pop
#[napi]
pub fn git_stash_pop(repo_path: String, index: u32) -> Result<()> {
    procode_git::git_stash_pop(&repo_path, index).map_err(|e| napi::Error::from_reason(e.to_string()))
}

// Git stash list
#[napi]
pub fn git_stash_list(repo_path: String) -> Result<String> {
    let stashes = procode_git::git_stash_list(&repo_path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(serde_json::to_string(&stashes).map_err(|e| napi::Error::from_reason(e.to_string()))?)
}

// Git stash drop
#[napi]
pub fn git_stash_drop(repo_path: String, index: u32) -> Result<()> {
    procode_git::git_stash_drop(&repo_path, index).map_err(|e| napi::Error::from_reason(e.to_string()))
}
