const natural = require('natural');
const logger = require('../utils/logger');

class EmbeddingService {
  constructor() {
    this.TfIdf = natural.TfIdf;
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Generate TF-IDF based embeddings for text
   * @param {string} text - Input text
   * @param {Array} corpus - Optional corpus for TF-IDF calculation
   * @returns {Array} Embedding vector
   */
  generateEmbedding(text, corpus = []) {
    try {
      const tfidf = new this.TfIdf();
      
      // Add the current text and any corpus documents
      tfidf.addDocument(this.preprocessText(text));
      corpus.forEach(doc => {
        tfidf.addDocument(this.preprocessText(doc));
      });

      // Get terms and their TF-IDF scores for the first document (our text)
      const embedding = {};
      tfidf.listTerms(0).forEach(item => {
        embedding[item.term] = item.tfidf;
      });

      // Convert to fixed-size vector (using top 200 features)
      const sortedTerms = Object.keys(embedding)
        .sort((a, b) => embedding[b] - embedding[a])
        .slice(0, 200);

      const vector = new Array(200).fill(0);
      sortedTerms.forEach((term, index) => {
        vector[index] = embedding[term] || 0;
      });

      return vector;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      return new Array(200).fill(0);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} vectorA - First vector
   * @param {Array} vectorB - Second vector
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(vectorA, vectorB) {
    try {
      if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same length');
      }

      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
      }

      if (normA === 0 || normB === 0) {
        return 0;
      }

      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    } catch (error) {
      logger.error('Error calculating similarity:', error);
      return 0;
    }
  }

  /**
   * Find most similar items from a collection
   * @param {string} queryText - Text to find similarities for
   * @param {Array} items - Array of items with text property
   * @param {number} topK - Number of top results to return
   * @returns {Array} Array of items with similarity scores
   */
  findSimilar(queryText, items, topK = 10) {
    try {
      const corpus = items.map(item => item.text || item.description || '');
      const queryEmbedding = this.generateEmbedding(queryText, corpus);

      const similarities = items.map((item, index) => {
        const itemText = item.text || item.description || '';
        const itemEmbedding = this.generateEmbedding(itemText, corpus);
        const similarity = this.calculateSimilarity(queryEmbedding, itemEmbedding);

        return {
          ...item,
          similarity: similarity,
          index: index
        };
      });

      // Sort by similarity and return top K
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    } catch (error) {
      logger.error('Error finding similar items:', error);
      return [];
    }
  }

  /**
   * Preprocess text for embedding generation
   * @param {string} text - Input text
   * @returns {string} Preprocessed text
   * @private
   */
  preprocessText(text) {
    if (!text) return '';

    // Convert to lowercase
    let processed = text.toLowerCase();

    // Remove special characters and numbers
    processed = processed.replace(/[^a-zA-Z\s]/g, ' ');

    // Tokenize
    const tokens = this.tokenizer.tokenize(processed);

    // Remove stop words
    const stopWords = natural.stopwords;
    const filteredTokens = tokens.filter(token => 
      !stopWords.includes(token) && token.length > 2
    );

    // Stem words
    const stemmedTokens = filteredTokens.map(token => 
      this.stemmer.stem(token)
    );

    return stemmedTokens.join(' ');
  }

  /**
   * Create keyword-based embeddings for quick matching
   * @param {string} text - Input text
   * @returns {Object} Keyword frequency object
   */
  createKeywordEmbedding(text) {
    try {
      const processed = this.preprocessText(text);
      const tokens = processed.split(' ').filter(token => token.length > 0);
      
      const keywordFreq = {};
      tokens.forEach(token => {
        keywordFreq[token] = (keywordFreq[token] || 0) + 1;
      });

      // Normalize frequencies
      const totalTokens = tokens.length;
      Object.keys(keywordFreq).forEach(keyword => {
        keywordFreq[keyword] = keywordFreq[keyword] / totalTokens;
      });

      return keywordFreq;
    } catch (error) {
      logger.error('Error creating keyword embedding:', error);
      return {};
    }
  }

  /**
   * Calculate keyword-based similarity
   * @param {Object} keywordsA - First keyword embedding
   * @param {Object} keywordsB - Second keyword embedding
   * @returns {number} Similarity score
   */
  calculateKeywordSimilarity(keywordsA, keywordsB) {
    try {
      const allKeywords = new Set([
        ...Object.keys(keywordsA),
        ...Object.keys(keywordsB)
      ]);

      let intersection = 0;
      let unionA = 0;
      let unionB = 0;

      allKeywords.forEach(keyword => {
        const freqA = keywordsA[keyword] || 0;
        const freqB = keywordsB[keyword] || 0;

        intersection += Math.min(freqA, freqB);
        unionA += freqA;
        unionB += freqB;
      });

      // Jaccard similarity with frequency weighting
      const union = unionA + unionB - intersection;
      return union > 0 ? intersection / union : 0;
    } catch (error) {
      logger.error('Error calculating keyword similarity:', error);
      return 0;
    }
  }

  /**
   * Extract key phrases from text
   * @param {string} text - Input text
   * @param {number} maxPhrases - Maximum number of phrases to extract
   * @returns {Array} Array of key phrases
   */
  extractKeyPhrases(text, maxPhrases = 10) {
    try {
      const processed = this.preprocessText(text);
      const tokens = processed.split(' ').filter(token => token.length > 0);

      // Simple n-gram extraction (bigrams and trigrams)
      const phrases = [];

      // Add significant single words
      const wordFreq = {};
      tokens.forEach(token => {
        wordFreq[token] = (wordFreq[token] || 0) + 1;
      });

      Object.keys(wordFreq)
        .filter(word => wordFreq[word] > 1 && word.length > 3)
        .forEach(word => phrases.push({ phrase: word, score: wordFreq[word] }));

      // Add bigrams
      for (let i = 0; i < tokens.length - 1; i++) {
        const bigram = `${tokens[i]} ${tokens[i + 1]}`;
        const existing = phrases.find(p => p.phrase === bigram);
        if (existing) {
          existing.score += 1;
        } else {
          phrases.push({ phrase: bigram, score: 1 });
        }
      }

      // Sort by score and return top phrases
      return phrases
        .sort((a, b) => b.score - a.score)
        .slice(0, maxPhrases)
        .map(p => p.phrase);
    } catch (error) {
      logger.error('Error extracting key phrases:', error);
      return [];
    }
  }
}

module.exports = new EmbeddingService();
