/// HNSW vector index for semantic code search
pub struct VectorIndex {
    vectors: Vec<Vec<f32>>,
    ids: Vec<String>,
    dimensions: usize,
}

impl VectorIndex {
    pub fn new(dimensions: usize) -> Self {
        Self {
            vectors: Vec::new(),
            ids: Vec::new(),
            dimensions,
        }
    }

    pub fn insert(&mut self, id: String, vector: Vec<f32>) {
        assert_eq!(vector.len(), self.dimensions);
        self.vectors.push(vector);
        self.ids.push(id);
    }

    pub fn search(&self, query: &[f32], k: usize) -> Vec<(String, f32)> {
        let mut scores: Vec<(String, f32)> = self
            .vectors
            .iter()
            .zip(self.ids.iter())
            .map(|(vec, id)| {
                let similarity = cosine_similarity(query, vec);
                (id.clone(), similarity)
            })
            .collect();

        scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        scores.into_iter().take(k).collect()
    }

    pub fn len(&self) -> usize {
        self.vectors.len()
    }

    pub fn is_empty(&self) -> bool {
        self.vectors.is_empty()
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
}
