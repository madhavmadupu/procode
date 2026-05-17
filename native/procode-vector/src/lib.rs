use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorItem {
    pub id: String,
    pub vector: Vec<f32>,
    pub metadata: Option<serde_json::Value>,
}

pub struct VectorIndex {
    vectors: Vec<VectorItem>,
    dimensions: usize,
}

impl VectorIndex {
    pub fn new(dimensions: usize) -> Self {
        Self {
            vectors: Vec::new(),
            dimensions,
        }
    }

    pub fn insert(&mut self, id: String, vector: Vec<f32>, metadata: Option<serde_json::Value>) {
        assert_eq!(vector.len(), self.dimensions);
        self.vectors.push(VectorItem {
            id,
            vector,
            metadata,
        });
    }

    pub fn search(&self, query: &[f32], k: usize) -> Vec<(String, f32, Option<serde_json::Value>)> {
        let mut scores: Vec<(String, f32, Option<serde_json::Value>)> = self
            .vectors
            .iter()
            .map(|item| {
                let similarity = cosine_similarity(query, &item.vector);
                (item.id.clone(), similarity, item.metadata.clone())
            })
            .collect();

        scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        scores.into_iter().take(k).collect()
    }

    pub fn delete(&mut self, id: &str) -> bool {
        let initial_len = self.vectors.len();
        self.vectors.retain(|item| item.id != id);
        self.vectors.len() < initial_len
    }

    pub fn rebuild(&mut self) {
        self.vectors.clear();
    }

    pub fn len(&self) -> usize {
        self.vectors.len()
    }

    pub fn is_empty(&self) -> bool {
        self.vectors.is_empty()
    }

    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(&self.vectors)
    }
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let dot = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum::<f32>();
    let norm_a = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot / (norm_a * norm_b)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity_identical() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!((sim - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![0.0, 1.0, 0.0];
        let sim = cosine_similarity(&a, &b);
        assert!(sim.abs() < 1e-6);
    }

    #[test]
    fn test_insert_and_search() {
        let mut index = VectorIndex::new(3);
        index.insert(
            "vec1".to_string(),
            vec![1.0, 0.0, 0.0],
            Some(serde_json::json!({"path": "/test.rs"})),
        );
        index.insert("vec2".to_string(), vec![0.0, 1.0, 0.0], None);

        let results = index.search(&[1.0, 0.0, 0.0], 1);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].0, "vec1");
        assert!((results[0].1 - 1.0).abs() < 1e-6);
    }

    #[test]
    fn test_delete() {
        let mut index = VectorIndex::new(3);
        index.insert("vec1".to_string(), vec![1.0, 0.0, 0.0], None);
        index.insert("vec2".to_string(), vec![0.0, 1.0, 0.0], None);

        assert!(index.delete("vec1"));
        assert_eq!(index.len(), 1);
        assert!(!index.delete("vec3"));
    }
}
