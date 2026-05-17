use chrono::{DateTime, Utc};
use git2::{
    BranchType, DiffFormat, Error as GitError, Repository, Status, StatusOptions, StatusShow,
};
use serde::Serialize;
use thiserror::Error;
use tracing::{debug, info, warn};

#[derive(Error, Debug)]
pub enum GitError {
    #[error("Not a git repository: {0}")]
    NotARepository(String),
    #[error("Git operation failed: {0}")]
    OperationFailed(String),
    #[error("Merge conflict detected")]
    MergeConflict,
    #[error("Authentication required")]
    AuthRequired,
    #[error("libgit2 error: {0}")]
    Libgit2(#[from] GitError),
}

pub type Result<T> = std::result::Result<T, GitError>;

#[derive(Debug, Clone, Serialize)]
pub struct FileStatusEntry {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct RepoStatus {
    pub branch: String,
    pub ahead: u32,
    pub behind: u32,
    pub files: Vec<FileStatusEntry>,
    pub has_conflicts: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct DiffHunk {
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
    pub lines: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FileDiff {
    pub path: String,
    pub old_path: Option<String>,
    pub hunks: Vec<DiffHunk>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BranchInfo {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub remote: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BlameLine {
    pub line_number: u32,
    pub author: String,
    pub email: String,
    pub timestamp: String,
    pub short_hash: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CommitInfo {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub email: String,
    pub timestamp: String,
    pub message: String,
    pub parent_hashes: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PullResult {
    pub updated: bool,
    pub commits_received: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct RemoteInfo {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct StashInfo {
    pub index: u32,
    pub message: String,
    pub author: String,
    pub timestamp: String,
}

fn open_repo(repo_path: &str) -> Result<Repository> {
    let repo = Repository::open(repo_path).map_err(|e| {
        if e.code() == GitError::Class::InvalidSpec {
            GitError::NotARepository(repo_path.to_string())
        } else {
            GitError::OperationFailed(format!("Failed to open repository: {}", e))
        }
    })?;
    Ok(repo)
}

fn format_timestamp(secs: i64) -> String {
    DateTime::<Utc>::from_timestamp(secs, 0)
        .map(|dt| dt.to_rfc3339())
        .unwrap_or_default()
}

fn format_file_status(status: Status) -> String {
    if status.is_conflicted() {
        "conflict".to_string()
    } else if status.is_wt_new() {
        "untracked".to_string()
    } else if status.is_wt_modified() {
        "modified".to_string()
    } else if status.is_wt_deleted() {
        "deleted".to_string()
    } else if status.is_index_new() {
        "added".to_string()
    } else if status.is_index_modified() {
        "modified".to_string()
    } else if status.is_index_deleted() {
        "deleted".to_string()
    } else if status.is_renamed() {
        "renamed".to_string()
    } else {
        "unknown".to_string()
    }
}

pub fn git_status(repo_path: &str) -> Result<RepoStatus> {
    info!("Getting git status for: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let branch = repo
        .head()
        .ok()
        .and_then(|h| h.shorthand().map(|s| s.to_string()))
        .unwrap_or_else(|| "HEAD".to_string());

    let mut ahead = 0u32;
    let mut behind = 0u32;
    if let Ok(head) = repo.head() {
        if let Ok(upstream) = repo.branch_upstream_name(head.name().unwrap_or("")) {
            if let Ok(upstream_name) = upstream.as_str() {
                if let Ok(upstream_ref) = repo.find_reference(upstream_name) {
                    if let Ok(local_oid) = head.target() {
                        if let Ok(upstream_oid) = upstream_ref.target() {
                            if let Ok((a, b)) =
                                repo.graph_ahead_behind(local_oid, upstream_oid)
                            {
                                ahead = a.ahead;
                                behind = a.behind;
                            }
                        }
                    }
                }
            }
        }
    }

    let mut statuses = repo
        .statuses(Some(
            StatusOptions::new()
                .include_ignored(false)
                .include_untracked(true)
                .show(StatusShow::IndexAndWorkdir),
        ))
        .map_err(|e| GitError::OperationFailed(format!("Failed to get status: {}", e)))?;

    let mut files = Vec::new();
    let mut has_conflicts = false;

    for entry in statuses.iter() {
        if let Some(path) = entry.path() {
            let status = entry.status();
            if status.is_conflicted() {
                has_conflicts = true;
            }
            files.push(FileStatusEntry {
                path: path.to_string(),
                status: format_file_status(status),
                staged: status.is_index_new()
                    || status.is_index_modified()
                    || status.is_index_deleted(),
            });
        }
    }

    debug!(
        "Status: branch={}, ahead={}, behind={}, files={}, conflicts={}",
        branch,
        ahead,
        behind,
        files.len(),
        has_conflicts
    );

    Ok(RepoStatus {
        branch,
        ahead,
        behind,
        files,
        has_conflicts,
    })
}

pub fn git_stage(repo_path: &str, paths: Vec<String>) -> Result<()> {
    info!("Staging {} files in: {}", paths.len(), repo_path);
    let repo = open_repo(repo_path)?;
    let mut index = repo.index().map_err(|e| {
        GitError::OperationFailed(format!("Failed to open index: {}", e))
    })?;

    for path in &paths {
        index
            .add_path(std::path::Path::new(path))
            .map_err(|e| GitError::OperationFailed(format!("Failed to stage {}: {}", path, e)))?;
    }

    index.write().map_err(|e| {
        GitError::OperationFailed(format!("Failed to write index: {}", e))
    })?;
    Ok(())
}

pub fn git_unstage(repo_path: &str, paths: Vec<String>) -> Result<()> {
    info!("Unstaging {} files in: {}", paths.len(), repo_path);
    let repo = open_repo(repo_path)?;
    let mut index = repo.index().map_err(|e| {
        GitError::OperationFailed(format!("Failed to open index: {}", e))
    })?;

    for path in &paths {
        if let Ok(entry) = index.get_path(std::path::Path::new(path), 0) {
            index.remove(
                Some(entry.path),
                0,
                false,
            )
            .map_err(|e| {
                GitError::OperationFailed(format!("Failed to unstage {}: {}", path, e))
            })?;
        }
    }

    index.write().map_err(|e| {
        GitError::OperationFailed(format!("Failed to write index: {}", e))
    })?;
    Ok(())
}

pub fn git_discard(repo_path: &str, paths: Vec<String>) -> Result<()> {
    info!("Discarding changes for {} files in: {}", paths.len(), repo_path);
    let repo = open_repo(repo_path)?;

    for path in &paths {
        repo.checkout_path(
            std::path::Path::new(path),
            Some(git2::build::CheckoutBuilder::new().force()),
        )
        .map_err(|e| {
            GitError::OperationFailed(format!("Failed to discard {}: {}", path, e))
        })?;
    }
    Ok(())
}

pub fn git_diff_unstaged(repo_path: &str, path: &str) -> Result<FileDiff> {
    info!("Getting unstaged diff for: {}", path);
    let repo = open_repo(repo_path)?;

    let diff = repo
        .diff_index_to_workdir(
            None,
            Some(
                git2::DiffOptions::new()
                    .pathspec(std::path::Path::new(path))
                    .context_lines(3),
            ),
        )
        .map_err(|e| GitError::OperationFailed(format!("Failed to diff: {}", e)))?;

    parse_diff(&diff, path)
}

pub fn git_diff_staged(repo_path: &str, path: &str) -> Result<FileDiff> {
    info!("Getting staged diff for: {}", path);
    let repo = open_repo(repo_path)?;

    let head_tree = repo
        .head()
        .ok()
        .and_then(|h| h.target())
        .and_then(|oid| repo.find_commit(oid).ok())
        .and_then(|c| c.tree().ok());

    let diff = repo
        .diff_tree_to_index(
            head_tree.as_ref(),
            Some(
                git2::DiffOptions::new()
                    .pathspec(std::path::Path::new(path))
                    .context_lines(3),
            ),
        )
        .map_err(|e| GitError::OperationFailed(format!("Failed to diff: {}", e)))?;

    parse_diff(&diff, path)
}

pub fn git_diff_commits(repo_path: &str, from: &str, to: &str) -> Result<FileDiff> {
    info!("Getting diff between commits {} and {}", from, to);
    let repo = open_repo(repo_path)?;

    let from_commit = repo
        .revparse_single(from)
        .map_err(|e| GitError::OperationFailed(format!("Invalid commit {}: {}", from, e)))?;
    let to_commit = repo
        .revparse_single(to)
        .map_err(|e| GitError::OperationFailed(format!("Invalid commit {}: {}", to, e)))?;

    let from_tree = from_commit
        .peel_to_tree()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get tree: {}", e)))?;
    let to_tree = to_commit
        .peel_to_tree()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get tree: {}", e)))?;

    let diff = repo
        .diff_tree_to_tree(
            Some(&from_tree),
            Some(&to_tree),
            Some(git2::DiffOptions::new().context_lines(3)),
        )
        .map_err(|e| GitError::OperationFailed(format!("Failed to diff: {}", e)))?;

    parse_diff(&diff, "")
}

fn parse_diff(diff: &git2::Diff, path: &str) -> Result<FileDiff> {
    let mut hunks: Vec<DiffHunk> = Vec::new();
    let mut current_hunk: Option<DiffHunk> = None;

    diff.print(DiffFormat::Patch, |delta, _hunk, line| {
        if let Some(hunk) = &mut current_hunk {
            if let Ok(content) = std::str::from_utf8(line.content()) {
                hunk.lines.push(content.to_string());
            }
        }
        true
    })
    .map_err(|e| GitError::OperationFailed(format!("Failed to parse diff: {}", e)))?;

    let diff_path = diff
        .get_delta(0)
        .ok()
        .and_then(|d| {
            d.new_file()
                .path()
                .map(|p| p.to_string_lossy().to_string())
        })
        .unwrap_or_else(|| path.to_string());

    let old_path = diff.get_delta(0).ok().and_then(|d| {
        d.old_file()
            .path()
            .map(|p| p.to_string_lossy().to_string())
    });

    Ok(FileDiff {
        path: diff_path,
        old_path,
        hunks,
    })
}

pub fn git_commit(repo_path: &str, message: &str, sign_off: bool) -> Result<String> {
    info!("Creating commit in: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let signature = repo
        .signature()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get signature: {}", e)))?;

    let parent_commit = repo
        .head()
        .ok()
        .and_then(|h| h.target())
        .and_then(|oid| repo.find_commit(oid).ok());

    let tree_id = repo
        .index()
        .map_err(|e| GitError::OperationFailed(format!("Failed to open index: {}", e)))?
        .write_tree()
        .map_err(|e| GitError::OperationFailed(format!("Failed to write tree: {}", e)))?;

    let tree = repo
        .find_tree(tree_id)
        .map_err(|e| GitError::OperationFailed(format!("Failed to find tree: {}", e)))?;

    let commit_message = if sign_off {
        format!(
            "{}\n\nSigned-off-by: {} <{}>",
            message,
            signature.name().unwrap_or(""),
            signature.email().unwrap_or("")
        )
    } else {
        message.to_string()
    };

    let commit_oid = repo
        .commit(
            Some("HEAD"),
            &signature,
            &signature,
            &commit_message,
            &tree,
            parent_commit
                .as_ref()
                .map(|c| std::slice::from_ref(c))
                .unwrap_or(&[]),
        )
        .map_err(|e| GitError::OperationFailed(format!("Failed to commit: {}", e)))?;

    info!("Commit created: {}", commit_oid);
    Ok(commit_oid.to_string())
}

pub fn git_amend(repo_path: &str, message: Option<&str>) -> Result<String> {
    info!("Amending commit in: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let head = repo
        .head()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get HEAD: {}", e)))?;

    let parent_commit = head
        .target()
        .and_then(|oid| repo.find_commit(oid).ok())
        .ok_or_else(|| GitError::OperationFailed("No commit to amend".to_string()))?;

    let signature = repo
        .signature()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get signature: {}", e)))?;

    let tree_id = repo
        .index()
        .map_err(|e| GitError::OperationFailed(format!("Failed to open index: {}", e)))?
        .write_tree()
        .map_err(|e| GitError::OperationFailed(format!("Failed to write tree: {}", e)))?;

    let tree = repo
        .find_tree(tree_id)
        .map_err(|e| GitError::OperationFailed(format!("Failed to find tree: {}", e)))?;

    let commit_message = message.unwrap_or_else(|| parent_commit.message().unwrap_or(""));

    let commit_oid = repo
        .commit(
            Some("HEAD"),
            &signature,
            &signature,
            commit_message,
            &tree,
            &[&parent_commit],
        )
        .map_err(|e| GitError::OperationFailed(format!("Failed to amend: {}", e)))?;

    info!("Commit amended: {}", commit_oid);
    Ok(commit_oid.to_string())
}

pub fn git_branch_list(repo_path: &str) -> Result<Vec<BranchInfo>> {
    info!("Listing branches in: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let head_name = repo
        .head()
        .ok()
        .and_then(|h| h.shorthand().map(|s| s.to_string()));

    let mut branches = Vec::new();

    for (branch, _) in repo.branches(Some(BranchType::Local)).map_err(|e| {
        GitError::OperationFailed(format!("Failed to list branches: {}", e))
    })? {
        let name = branch
            .name()
            .ok()
            .flatten()
            .unwrap_or("unknown")
            .to_string();

        branches.push(BranchInfo {
            name: name.clone(),
            is_current: head_name.as_deref() == Some(&name),
            is_remote: false,
            remote: None,
        });
    }

    for (branch, _) in repo.branches(Some(BranchType::Remote)).map_err(|e| {
        GitError::OperationFailed(format!("Failed to list remote branches: {}", e))
    })? {
        let name = branch
            .name()
            .ok()
            .flatten()
            .unwrap_or("unknown")
            .to_string();

        branches.push(BranchInfo {
            name,
            is_current: false,
            is_remote: true,
            remote: None,
        });
    }

    debug!("Found {} branches", branches.len());
    Ok(branches)
}

pub fn git_branch_create(repo_path: &str, name: &str, from: Option<&str>) -> Result<()> {
    info!("Creating branch '{}' in: {}", name, repo_path);
    let repo = open_repo(repo_path)?;

    let target_commit = if let Some(from_ref) = from {
        repo.revparse_single(from_ref)
            .map_err(|e| GitError::OperationFailed(format!("Invalid reference {}: {}", from_ref, e)))?
            .peel_to_commit()
            .map_err(|e| GitError::OperationFailed(format!("Failed to peel to commit: {}", e)))?
    } else {
        repo.head()
            .map_err(|e| GitError::OperationFailed(format!("Failed to get HEAD: {}", e)))?
            .target()
            .and_then(|oid| repo.find_commit(oid).ok())
            .ok_or_else(|| GitError::OperationFailed("Failed to get HEAD commit".to_string()))?
    };

    repo.branch(name, &target_commit, false)
        .map_err(|e| GitError::OperationFailed(format!("Failed to create branch: {}", e)))?;

    info!("Branch '{}' created", name);
    Ok(())
}

pub fn git_branch_checkout(repo_path: &str, name: &str) -> Result<()> {
    info!("Checking out branch '{}' in: {}", name, repo_path);
    let repo = open_repo(repo_path)?;

    let (commit, reference_name) = if name.contains('/') {
        let reference = repo
            .find_reference(name)
            .map_err(|e| GitError::OperationFailed(format!("Branch not found: {}", e)))?;
        let commit = reference
            .peel_to_commit()
            .map_err(|e| GitError::OperationFailed(format!("Failed to peel to commit: {}", e)))?;
        (commit, name.to_string())
    } else {
        let reference = repo
            .find_branch(name, BranchType::Local)
            .map_err(|e| GitError::OperationFailed(format!("Branch not found: {}", e)))?;
        let commit = reference
            .get()
            .peel_to_commit()
            .map_err(|e| GitError::OperationFailed(format!("Failed to peel to commit: {}", e)))?;
        (commit, format!("refs/heads/{}", name))
    };

    repo.checkout_tree(
        commit.tree().map_err(|e| {
            GitError::OperationFailed(format!("Failed to get tree: {}", e))
        })?,
        Some(git2::build::CheckoutBuilder::new().force()),
    )
    .map_err(|e| GitError::OperationFailed(format!("Checkout failed: {}", e)))?;

    repo.set_head(reference_name.as_str())
        .map_err(|e| GitError::OperationFailed(format!("Failed to set HEAD: {}", e)))?;

    info!("Checked out branch '{}'", name);
    Ok(())
}

pub fn git_branch_delete(repo_path: &str, name: &str, force: bool) -> Result<()> {
    info!("Deleting branch '{}' in: {}", name, repo_path);
    let repo = open_repo(repo_path)?;

    let mut branch = repo
        .find_branch(name, BranchType::Local)
        .map_err(|e| GitError::OperationFailed(format!("Branch not found: {}", e)))?;

    branch
        .delete()
        .map_err(|e| GitError::OperationFailed(format!("Failed to delete branch: {}", e)))?;

    info!("Branch '{}' deleted", name);
    Ok(())
}

pub fn git_branch_current(repo_path: &str) -> Result<String> {
    let repo = open_repo(repo_path)?;

    repo.head()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get HEAD: {}", e)))?
        .shorthand()
        .map(|s| s.to_string())
        .ok_or_else(|| GitError::OperationFailed("No current branch".to_string()))
}

pub fn git_blame(repo_path: &str, path: &str) -> Result<Vec<BlameLine>> {
    info!("Getting blame for: {}", path);
    let repo = open_repo(repo_path)?;

    let blame = repo
        .blame_file(path, Some(git2::BlameOptions::new()))
        .map_err(|e| GitError::OperationFailed(format!("Failed to blame: {}", e)))?;

    let mut result = Vec::new();

    for hunk_idx in 0..blame.hunk_count() {
        let hunk = blame
            .get_index(hunk_idx)
            .ok_or_else(|| GitError::OperationFailed("Failed to get blame hunk".to_string()))?;

        let author = hunk
            .final_signature()
            .map(|s| s.name().unwrap_or("unknown").to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let email = hunk
            .final_signature()
            .map(|s| s.email().unwrap_or("").to_string())
            .unwrap_or_default();

        let timestamp = hunk
            .final_signature()
            .map(|s| format_timestamp(s.when().seconds()))
            .unwrap_or_default();

        let short_hash = hunk.orig_commit_id().to_string()[..7].to_string();

        let message = repo
            .find_commit(hunk.orig_commit_id())
            .ok()
            .and_then(|c| c.summary().map(|s| s.to_string()))
            .unwrap_or_default();

        for line_num in hunk.final_start_line_number()
            ..hunk.final_start_line_number() + hunk.final_signature().map(|_| 1).unwrap_or(1)
        {
            result.push(BlameLine {
                line_number: line_num,
                author: author.clone(),
                email: email.clone(),
                timestamp: timestamp.clone(),
                short_hash: short_hash.clone(),
                message: message.clone(),
            });
        }
    }

    debug!("Blame: {} lines for {}", result.len(), path);
    Ok(result)
}

pub fn git_log(repo_path: &str, limit: u32, path: Option<&str>) -> Result<Vec<CommitInfo>> {
    info!("Getting git log for: {} (limit: {})", repo_path, limit);
    let repo = open_repo(repo_path)?;

    let mut revwalk = repo
        .revwalk()
        .map_err(|e| GitError::OperationFailed(format!("Failed to create revwalk: {}", e)))?;

    revwalk
        .push_head()
        .map_err(|e| GitError::OperationFailed(format!("Failed to push HEAD: {}", e)))?;

    revwalk.set_sorting(git2::Sort::TIME).ok();

    let mut commits = Vec::new();

    for oid in revwalk.take(limit as usize) {
        let oid = oid.map_err(|e| {
            GitError::OperationFailed(format!("Failed to walk commits: {}", e))
        })?;

        let commit = repo
            .find_commit(oid)
            .map_err(|e| GitError::OperationFailed(format!("Failed to find commit: {}", e)))?;

        let parent_hashes = commit
            .parent_ids()
            .iter()
            .map(|id| id.to_string())
            .collect();

        commits.push(CommitInfo {
            hash: oid.to_string(),
            short_hash: oid.to_string()[..7].to_string(),
            author: commit
                .author()
                .name()
                .unwrap_or("unknown")
                .to_string(),
            email: commit.author().email().unwrap_or("").to_string(),
            timestamp: format_timestamp(commit.author().when().seconds()),
            message: commit.summary().unwrap_or("").to_string(),
            parent_hashes,
        });
    }

    debug!("Log: {} commits", commits.len());
    Ok(commits)
}

pub fn git_fetch(repo_path: &str, remote: Option<&str>) -> Result<()> {
    info!("Fetching from remote in: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let remote_name = remote.unwrap_or("origin");

    let mut remote_obj = repo
        .find_remote(remote_name)
        .map_err(|e| GitError::OperationFailed(format!("Remote not found: {}", e)))?;

    remote_obj
        .fetch(&[] as &[&str], None, None)
        .map_err(|e| GitError::OperationFailed(format!("Fetch failed: {}", e)))?;

    info!("Fetch complete from {}", remote_name);
    Ok(())
}

pub fn git_pull(repo_path: &str) -> Result<PullResult> {
    info!("Pulling in: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let head = repo
        .head()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get HEAD: {}", e)))?;

    let branch_name = head
        .shorthand()
        .ok_or_else(|| GitError::OperationFailed("No current branch".to_string()))?;

    let remote_name = "origin";
    let refspec = format!("refs/heads/{}", branch_name);

    let mut remote = repo
        .find_remote(remote_name)
        .map_err(|e| GitError::OperationFailed(format!("Remote not found: {}", e)))?;

    remote
        .fetch(&[&refspec], None, None)
        .map_err(|e| GitError::OperationFailed(format!("Fetch failed: {}", e)))?;

    let fetch_head = repo
        .find_reference("FETCH_HEAD")
        .map_err(|e| GitError::OperationFailed(format!("FETCH_HEAD not found: {}", e)))?;

    let fetch_commit = fetch_head
        .peel_to_commit()
        .map_err(|e| GitError::OperationFailed(format!("Failed to peel FETCH_HEAD: {}", e)))?;

    let head_commit = repo
        .head()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get HEAD: {}", e)))?
        .peel_to_commit()
        .map_err(|e| GitError::OperationFailed(format!("Failed to peel HEAD: {}", e)))?;

    let merge_base = repo
        .merge_base(head_commit.id(), fetch_commit.id())
        .map_err(|e| GitError::OperationFailed(format!("Failed to find merge base: {}", e)))?;

    if merge_base == fetch_commit.id() {
        return Ok(PullResult {
            updated: false,
            commits_received: 0,
        });
    }

    let head_tree = head_commit
        .tree()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get tree: {}", e)))?;

    let fetch_tree = fetch_commit
        .tree()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get tree: {}", e)))?;

    let mut merge_index = repo
        .merge_trees(&merge_base, &head_tree, &fetch_tree, None)
        .map_err(|e| GitError::OperationFailed(format!("Merge failed: {}", e)))?;

    if merge_index.has_conflicts() {
        return Err(GitError::MergeConflict);
    }

    repo.checkout_index(
        Some(&mut merge_index),
        Some(git2::build::CheckoutBuilder::new().force()),
    )
    .map_err(|e| GitError::OperationFailed(format!("Checkout failed: {}", e)))?;

    let signature = repo
        .signature()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get signature: {}", e)))?;

    repo.reference(
        "HEAD",
        fetch_commit.id(),
        true,
        "pull: Fast-forward",
    )
    .map_err(|e| GitError::OperationFailed(format!("Failed to update HEAD: {}", e)))?;

    info!("Pull complete");
    Ok(PullResult {
        updated: true,
        commits_received: 1,
    })
}

pub fn git_push(repo_path: &str, remote: &str, branch: &str) -> Result<()> {
    info!("Pushing to {}/{} in: {}", remote, branch, repo_path);
    let repo = open_repo(repo_path)?;

    let mut remote_obj = repo
        .find_remote(remote)
        .map_err(|e| GitError::OperationFailed(format!("Remote not found: {}", e)))?;

    let refspec = format!("refs/heads/{}:refs/heads/{}", branch, branch);

    remote_obj
        .push(&[&refspec], None)
        .map_err(|e| GitError::OperationFailed(format!("Push failed: {}", e)))?;

    info!("Push complete to {}/{}", remote, branch);
    Ok(())
}

pub fn git_remote_list(repo_path: &str) -> Result<Vec<RemoteInfo>> {
    info!("Listing remotes in: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let mut remotes = Vec::new();

    for remote_name in repo
        .remote_names()
        .map_err(|e| GitError::OperationFailed(format!("Failed to list remotes: {}", e)))?
    {
        if let Ok(remote) = repo.find_remote(remote_name.to_str().unwrap_or("")) {
            if let Some(url) = remote.url() {
                remotes.push(RemoteInfo {
                    name: remote_name.to_string(),
                    url: url.to_string(),
                });
            }
        }
    }

    debug!("Found {} remotes", remotes.len());
    Ok(remotes)
}

pub fn git_stash_push(repo_path: &str, message: Option<&str>) -> Result<()> {
    info!("Pushing stash in: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let signature = repo
        .signature()
        .map_err(|e| GitError::OperationFailed(format!("Failed to get signature: {}", e)))?;

    let stash_message = message.unwrap_or("WIP on stash");

    repo.stash_save2(
        &signature,
        stash_message,
        Some(git2::StashFlags::INCLUDE_UNTRACKED),
    )
    .map_err(|e| GitError::OperationFailed(format!("Stash push failed: {}", e)))?;

    info!("Stash pushed");
    Ok(())
}

pub fn git_stash_pop(repo_path: &str, index: u32) -> Result<()> {
    info!("Popping stash index {} in: {}", index, repo_path);
    let repo = open_repo(repo_path)?;

    repo.stash_pop(index, None)
        .map_err(|e| GitError::OperationFailed(format!("Stash pop failed: {}", e)))?;

    info!("Stash popped");
    Ok(())
}

pub fn git_stash_list(repo_path: &str) -> Result<Vec<StashInfo>> {
    info!("Listing stashes in: {}", repo_path);
    let repo = open_repo(repo_path)?;

    let mut stashes = Vec::new();

    repo.stash_foreach(|index, message, oid| {
        stashes.push(StashInfo {
            index,
            message: message.to_string(),
            author: "unknown".to_string(),
            timestamp: format_timestamp(0),
        });
        true
    })
    .map_err(|e| GitError::OperationFailed(format!("Stash list failed: {}", e)))?;

    debug!("Found {} stashes", stashes.len());
    Ok(stashes)
}

pub fn git_stash_drop(repo_path: &str, index: u32) -> Result<()> {
    info!("Dropping stash index {} in: {}", index, repo_path);
    let repo = open_repo(repo_path)?;

    repo.stash_drop(index)
        .map_err(|e| GitError::OperationFailed(format!("Stash drop failed: {}", e)))?;

    info!("Stash dropped");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_test_repo() -> (TempDir, String) {
        let temp_dir = TempDir::new().unwrap();
        let repo_path = temp_dir.path().to_str().unwrap().to_string();

        Repository::init(&repo_path).unwrap();

        let gitignore_path = format!("{}/.gitignore", repo_path);
        fs::write(&gitignore_path, "*.log").unwrap();

        (temp_dir, repo_path)
    }

    #[test]
    fn test_git_status_empty() {
        let (_temp, repo_path) = create_test_repo();
        let status = git_status(&repo_path).unwrap();
        assert_eq!(status.branch, "master");
        assert!(status.files.is_empty());
    }

    #[test]
    fn test_git_commit_flow() {
        let (_temp, repo_path) = create_test_repo();

        let file_path = format!("{}/test.txt", repo_path);
        fs::write(&file_path, "hello world").unwrap();

        git_stage(&repo_path, vec!["test.txt".to_string()]).unwrap();
        let commit_hash = git_commit(&repo_path, "Initial commit", false).unwrap();

        assert!(!commit_hash.is_empty());
    }

    #[test]
    fn test_git_branch_operations() {
        let (_temp, repo_path) = create_test_repo();

        let file_path = format!("{}/test.txt", repo_path);
        fs::write(&file_path, "hello").unwrap();

        git_stage(&repo_path, vec!["test.txt".to_string()]).unwrap();
        git_commit(&repo_path, "Initial commit", false).unwrap();

        git_branch_create(&repo_path, "feature", None).unwrap();
        let branches = git_branch_list(&repo_path).unwrap();

        assert!(branches.iter().any(|b| b.name == "master"));
        assert!(branches.iter().any(|b| b.name == "feature"));
    }

    #[test]
    fn test_format_file_status() {
        assert_eq!(format_file_status(Status::WT_NEW), "untracked");
        assert_eq!(format_file_status(Status::WT_MODIFIED), "modified");
        assert_eq!(format_file_status(Status::WT_DELETED), "deleted");
        assert_eq!(format_file_status(Status::INDEX_NEW), "added");
    }
}
