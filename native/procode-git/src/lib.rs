use git2::{Repository, StatusOptions};
use serde::Serialize;

/// File status in git
#[derive(Debug, Clone, Serialize)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
}

/// Get git status for a repository
pub fn get_status(repo_path: &str) -> Result<Vec<FileStatus>, String> {
    let repo = Repository::open(repo_path).map_err(|e| e.to_string())?;

    let mut statuses = repo
        .statuses(Some(StatusOptions::new().include_ignored(false)))
        .map_err(|e| e.to_string())?;

    let result = statuses
        .iter()
        .filter_map(|entry| {
            entry.path().map(|path| FileStatus {
                path: path.to_string(),
                status: format_status(entry.status()),
            })
        })
        .collect();

    Ok(result)
}

fn format_status(status: git2::Status) -> String {
    if status.is_wt_new() {
        "untracked".to_string()
    } else if status.is_wt_modified() {
        "modified".to_string()
    } else if status.is_wt_deleted() {
        "deleted".to_string()
    } else if status.is_index_new() {
        "staged".to_string()
    } else {
        "unknown".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_status() {
        assert_eq!(format_status(git2::Status::WT_NEW), "untracked");
        assert_eq!(format_status(git2::Status::WT_MODIFIED), "modified");
    }
}
