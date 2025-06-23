// Mock client to replace Base44 SDK for bolt.new platform
export const mockBase44 = {
  entities: {
    Conversation: {
      async list(sort) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        return conversations.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
      },
      async create(data) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const newConv = {
          id: Date.now().toString(),
          ...data,
          created_date: new Date().toISOString()
        };
        conversations.unshift(newConv);
        localStorage.setItem('conversations', JSON.stringify(conversations));
        return newConv;
      },
      async update(id, data) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const index = conversations.findIndex(c => c.id === id);
        if (index !== -1) {
          conversations[index] = { ...conversations[index], ...data };
          localStorage.setItem('conversations', JSON.stringify(conversations));
          return conversations[index];
        }
        return null;
      },
      async get(id) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        return conversations.find(c => c.id === id);
      }
    },
    Message: {
      async filter(query, sort) {
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        let filtered = messages.filter(m => m.conversation_id === query.conversation_id);
        return filtered.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      },
      async list(sort) {
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        return messages.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      },
      async create(data) {
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        const newMessage = {
          id: Date.now().toString(),
          ...data,
          created_date: new Date().toISOString()
        };
        messages.push(newMessage);
        localStorage.setItem('messages', JSON.stringify(messages));
        return newMessage;
      }
    },
    User: {
      async me() {
        return {
          id: 'demo-user',
          full_name: 'Demo User',
          email: 'demo@example.com',
          subscription_status: 'pro', // Set to pro for demo
          is_admin: false
        };
      },
      async login() {
        // Mock login - just return success
        return { success: true };
      }
    },
    ChatFile: {
      async create(data) {
        const files = JSON.parse(localStorage.getItem('chatFiles') || '[]');
        const newFile = { id: Date.now().toString(), ...data };
        files.push(newFile);
        localStorage.setItem('chatFiles', JSON.stringify(files));
        return newFile;
      }
    },
    CodeCanvas: {
      async filter(query) {
        const canvases = JSON.parse(localStorage.getItem('codeCanvases') || '[]');
        return canvases.filter(c => c.conversation_id === query.conversation_id);
      },
      async create(data) {
        const canvases = JSON.parse(localStorage.getItem('codeCanvases') || '[]');
        const newCanvas = { id: Date.now().toString(), ...data };
        canvases.push(newCanvas);
        localStorage.setItem('codeCanvases', JSON.stringify(canvases));
        return newCanvas;
      },
      async update(id, data) {
        const canvases = JSON.parse(localStorage.getItem('codeCanvases') || '[]');
        const index = canvases.findIndex(c => c.id === id);
        if (index !== -1) {
          canvases[index] = { ...canvases[index], ...data };
          localStorage.setItem('codeCanvases', JSON.stringify(canvases));
          return canvases[index];
        }
        return null;
      }
    },
    ChatFolder: {
      async filter(query) {
        return JSON.parse(localStorage.getItem('chatFolders') || '[]');
      },
      async create(data) {
        const folders = JSON.parse(localStorage.getItem('chatFolders') || '[]');
        const newFolder = { id: Date.now().toString(), ...data };
        folders.push(newFolder);
        localStorage.setItem('chatFolders', JSON.stringify(folders));
        return newFolder;
      },
      async update(id, data) {
        const folders = JSON.parse(localStorage.getItem('chatFolders') || '[]');
        const index = folders.findIndex(f => f.id === id);
        if (index !== -1) {
          folders[index] = { ...folders[index], ...data };
          localStorage.setItem('chatFolders', JSON.stringify(folders));
          return folders[index];
        }
        return null;
      },
      async delete(id) {
        const folders = JSON.parse(localStorage.getItem('chatFolders') || '[]');
        const filtered = folders.filter(f => f.id !== id);
        localStorage.setItem('chatFolders', JSON.stringify(filtered));
        return true;
      }
    },
    RepositoryFile: {
      async filter(query) {
        const files = JSON.parse(localStorage.getItem('repositoryFiles') || '[]');
        return files.filter(f => f.conversation_id === query.conversation_id);
      },
      async create(data) {
        const files = JSON.parse(localStorage.getItem('repositoryFiles') || '[]');
        const newFile = { id: Date.now().toString(), ...data };
        files.push(newFile);
        localStorage.setItem('repositoryFiles', JSON.stringify(files));
        return newFile;
      },
      async delete(id) {
        const files = JSON.parse(localStorage.getItem('repositoryFiles') || '[]');
        const filtered = files.filter(f => f.id !== id);
        localStorage.setItem('repositoryFiles', JSON.stringify(filtered));
        return true;
      }
    },
    FileRepository: {
      async filter(query) {
        const repos = JSON.parse(localStorage.getItem('fileRepositories') || '[]');
        return repos.filter(r => r.conversation_id === query.conversation_id);
      },
      async create(data) {
        const repos = JSON.parse(localStorage.getItem('fileRepositories') || '[]');
        const newRepo = { id: Date.now().toString(), ...data };
        repos.push(newRepo);
        localStorage.setItem('fileRepositories', JSON.stringify(repos));
        return newRepo;
      },
      async update(id, data) {
        const repos = JSON.parse(localStorage.getItem('fileRepositories') || '[]');
        const index = repos.findIndex(r => r.id === id);
        if (index !== -1) {
          repos[index] = { ...repos[index], ...data };
          localStorage.setItem('fileRepositories', JSON.stringify(repos));
          return repos[index];
        }
        return null;
      }
    },
    ProjectBuildRepository: {
      async filter(query) {
        return []; // Mock empty for now
      }
    },
    ProjectBuildFile: {
      async filter(query) {
        return []; // Mock empty for now
      }
    },
    ToolConfiguration: {
      async filter(query) {
        return []; // Mock empty for now
      },
      async list() {
        return [];
      }
    },
    AIToolSchema: {
      async filter(query) {
        return []; // Mock empty for now
      }
    },
    AIMemory: {
      async filter(query) {
        return []; // Mock empty for now
      },
      async create(data) {
        return { id: Date.now().toString(), ...data };
      },
      async bulkCreate(data) {
        return data.map(item => ({ id: Date.now().toString(), ...item }));
      }
    },
    Subscription: {
      async filter() {
        return []; // Mock no subscription for demo
      }
    }
  },
  integrations: {
    Core: {
      async InvokeLLM({ prompt, response_json_schema, file_urls }) {
        // Mock AI response - in a real implementation, you'd call an actual AI API
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        if (response_json_schema) {
          // Return mock structured response
          if (response_json_schema.properties?.memories) {
            return {
              memories: [
                {
                  memory_type: "factual",
                  key: "demo_memory",
                  content: "This is a demo memory extracted from the uploaded content.",
                  context: "Demo context",
                  importance_score: 7
                }
              ]
            };
          }
          return { result: "Mock structured response" };
        }
        
        // Return mock conversational response
        const responses = [
          "I understand you'd like me to analyze this. Based on the information provided, I can see several interesting patterns and opportunities for improvement.",
          "This is a fascinating topic! Let me share my perspective on this matter and how we might approach it collaboratively.",
          "I've reviewed the content and have some thoughts to share. The key aspects I notice are the complexity and the potential for optimization.",
          "Thank you for sharing this with me. I think there are several angles we could explore together to make this even better.",
          "This presents an interesting challenge. Let me break down my analysis and suggest some potential next steps we could take."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
      },
      async UploadFile({ file }) {
        // Mock file upload - create a blob URL
        const url = URL.createObjectURL(file);
        return { file_url: url };
      },
      async GenerateImage({ prompt }) {
        // Mock image generation with a placeholder
        return { 
          url: `https://picsum.photos/512/512?random=${Date.now()}&text=${encodeURIComponent(prompt.substring(0, 20))}` 
        };
      },
      async ExtractDataFromUploadedFile({ file_url, json_schema }) {
        // Mock content extraction
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          status: 'success',
          output: {
            content: "This is mock extracted content from the uploaded file. In a real implementation, this would contain the actual file content.",
            summary: "Mock summary of the file content",
            file_type: "Document"
          }
        };
      }
    }
  },
  functions: {
    async executeToolCall() {
      return { data: { result: "Mock tool execution result" }, error: null };
    },
    async testToolConfiguration() {
      return { data: { success: true, message: "Mock test successful" } };
    },
    async createCheckoutSession() {
      return { data: { url: "https://example.com/mock-checkout" } };
    },
    async createPortalSession() {
      return { data: { url: "https://example.com/mock-portal" } };
    },
    async exportProjectAsZip() {
      return { data: "mock zip data", headers: { 'content-disposition': 'attachment; filename="project.zip"' } };
    },
    async syncStripeSubscription() {
      return { 
        data: {
          id: 'demo-user',
          full_name: 'Demo User',
          subscription_status: 'pro'
        }
      };
    }
  }
};