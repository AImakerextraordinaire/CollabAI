
import { AIMemory, ConversationSummary } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";

class MemoryManager {
  constructor(aiModel) {
    this.aiModel = aiModel;
  }

  // Store a new memory
  async storeMemory(type, key, content, context = "", importance = 5) {
    try {
      // Generate embedding for vector search
      const embedding = await this.generateEmbedding(content);
      
      await AIMemory.create({
        ai_model: this.aiModel,
        memory_type: type,
        key,
        content,
        context,
        importance_score: importance,
        embedding_vector: JSON.stringify(embedding),
        related_conversations: []
      });
    } catch (error) {
      console.log("Failed to store memory:", error);
    }
  }

  // Retrieve relevant memories for a query
  async retrieveRelevantMemories(query, limit = 5) {
    try {
      // Get query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Get the top 100 most important memories for this AI instead of all of them
      const memories = await AIMemory.filter({ ai_model: this.aiModel }, "-importance_score", 100);
      
      // Calculate similarity scores and sort
      const scoredMemories = memories.map(memory => {
        const memoryEmbedding = JSON.parse(memory.embedding_vector || "[]");
        const similarity = this.cosineSimilarity(queryEmbedding, memoryEmbedding);
        return { ...memory, similarity };
      }).sort((a, b) => b.similarity - a.similarity);

      // Update access counts
      const topMemories = scoredMemories.slice(0, limit);
      for (const memory of topMemories) {
        await AIMemory.update(memory.id, {
          access_count: (memory.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        });
      }

      return topMemories;
    } catch (error) {
      console.log("Failed to retrieve memories:", error);
      return [];
    }
  }

  // Generate conversation summary and extract learnings
  async processConversationEnd(conversationId, messages) {
    try {
      const conversationText = messages.map(msg => {
        if (msg.role === 'human') return `Human: ${msg.content}`;
        return `${msg.ai_model}: ${msg.content}`;
      }).join('\n\n');

      const summaryPrompt = `Analyze this conversation and extract key learnings for future reference.

Conversation:
${conversationText}

Please provide:
1. A concise summary of the conversation
2. Key insights discovered
3. New factual information learned
4. User preferences observed
5. Potential follow-up topics

Format as JSON with the keys: summary, key_insights, learned_facts, user_preferences, follow_up_topics`;

      const result = await InvokeLLM({
        prompt: summaryPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_insights: { type: "array", items: { type: "string" } },
            learned_facts: { type: "array", items: { type: "string" } },
            user_preferences: { type: "array", items: { type: "string" } },
            follow_up_topics: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Store conversation summary
      await ConversationSummary.create({
        conversation_id: conversationId,
        ai_model: this.aiModel,
        ...result
      });

      // Store individual memories
      await this.extractAndStoreMemories(result, conversationId);

    } catch (error) {
      console.log("Failed to process conversation:", error);
    }
  }

  // Extract and store individual memories from conversation analysis
  async extractAndStoreMemories(analysis, conversationId) {
    const memories = [];

    // Store factual memories
    for (const fact of analysis.learned_facts || []) {
      memories.push({
        type: "factual",
        key: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: fact,
        context: `Learned from conversation ${conversationId}`,
        importance: 7
      });
    }

    // Store user preferences
    for (const pref of analysis.user_preferences || []) {
      memories.push({
        type: "preference",
        key: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: pref,
        context: `User preference from conversation ${conversationId}`,
        importance: 8
      });
    }

    // Store key insights
    for (const insight of analysis.key_insights || []) {
      memories.push({
        type: "skill",
        key: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: insight,
        context: `Insight from conversation ${conversationId}`,
        importance: 6
      });
    }

    // Save all memories
    for (const memory of memories) {
      await this.storeMemory(
        memory.type,
        memory.key,
        memory.content,
        memory.context,
        memory.importance
      );
    }
  }

  // Get conversation context including relevant memories
  async getEnhancedContext(currentQuery, recentHistory) {
    const relevantMemories = await this.retrieveRelevantMemories(currentQuery, 3);
    
    let memoryContext = "";
    if (relevantMemories.length > 0) {
      memoryContext = "\n\nRelevant memories from previous conversations:\n";
      relevantMemories.forEach((memory, index) => {
        memoryContext += `${index + 1}. [${memory.memory_type}] ${memory.content}\n`;
      });
    }

    return memoryContext;
  }

  // Simple embedding generation (placeholder - in real implementation you'd use a proper embedding model)
  async generateEmbedding(text) {
    // This is a simplified hash-based embedding for demonstration
    // In production, you'd use a proper embedding model
    const hash = this.simpleHash(text);
    const embedding = [];
    for (let i = 0; i < 384; i++) {
      embedding.push(Math.sin(hash + i) * Math.cos(hash * i));
    }
    return embedding;
  }

  // Simple hash function
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Cosine similarity calculation
  cosineSimilarity(vecA, vecB) {
    if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default MemoryManager;
