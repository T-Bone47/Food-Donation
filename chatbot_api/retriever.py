"""
BM25 Information Retrieval Engine for FoodShare Knowledge Base.
Provides grounded lexical retrieval with role-specific relevance boosting and source attribution.
"""
import math
import re
from typing import List, Dict, Any, Optional

from knowledge_base import KNOWLEDGE_CHUNKS
from config import BM25_TOP_K, BM25_RELEVANCE_THRESHOLD

# Common English stop words
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on",
    "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
    "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
    "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
    "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves"
}

def tokenize(text: str) -> List[str]:
    """Tokenize text into lowercase alphanumeric terms excluding stop words."""
    tokens = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text.lower())
    return [t for t in tokens if t not in STOP_WORDS]

class BM25Retriever:
    """In-memory BM25 ranker over curated knowledge chunks."""

    def __init__(self, chunks: List[Dict[str, Any]], k1: float = 1.5, b: float = 0.75):
        self.chunks = chunks
        self.k1 = k1
        self.b = b
        self.doc_len = []
        self.doc_term_freqs = []
        self.doc_freqs = {}
        self.avg_doc_len = 0.0
        self.total_docs = len(chunks)
        self._build_index()

    def _build_index(self):
        total_len = 0
        for chunk in self.chunks:
            full_text = f"{chunk['title']} {chunk['category']} {chunk['content']}"
            tokens = tokenize(full_text)
            length = len(tokens)
            self.doc_len.append(length)
            total_len += length

            tf = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            self.doc_term_freqs.append(tf)

            for term in tf.keys():
                self.doc_freqs[term] = self.doc_freqs.get(term, 0) + 1

        self.avg_doc_len = total_len / self.total_docs if self.total_docs > 0 else 1.0

    def _idf(self, term: str) -> float:
        n_q = self.doc_freqs.get(term, 0)
        return math.log(((self.total_docs - n_q + 0.5) / (n_q + 0.5)) + 1.0)

    def retrieve(
        self,
        query: str,
        user_role: Optional[str] = None,
        top_k: int = BM25_TOP_K,
        threshold: float = BM25_RELEVANCE_THRESHOLD
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant knowledge chunks with role-aware boosting.
        """
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        scores = []
        for idx, chunk in enumerate(self.chunks):
            score = 0.0
            doc_len = self.doc_len[idx]
            tf = self.doc_term_freqs[idx]

            for term in query_tokens:
                if term not in tf:
                    continue
                term_freq = tf[term]
                idf = self._idf(term)
                numerator = term_freq * (self.k1 + 1.0)
                denominator = term_freq + self.k1 * (1.0 - self.b + self.b * (doc_len / self.avg_doc_len))
                score += idf * (numerator / denominator)

            # Role boosting: if chunk matches user's specific role, boost score by 25%
            if user_role and (user_role in chunk.get("roles", []) or user_role.lower() == chunk.get("category", "").lower()):
                score *= 1.25

            if score > 0:
                scores.append((idx, score))

        scores.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in scores:
            if score >= threshold or (len(results) == 0 and score > 0.8):
                chunk = dict(self.chunks[idx])
                chunk["relevance_score"] = round(score, 3)
                results.append(chunk)
                if len(results) >= top_k:
                    break

        return results

# Singleton retriever instance initialized with knowledge chunks
retriever = BM25Retriever(KNOWLEDGE_CHUNKS)

