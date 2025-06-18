
import React, { useState, useEffect, useRef } from "react";
import { Conversation } from "@/api/entities";
import { Message } from "@/api/entities";
import { User } from "@/api/entities";
import { AIMemory } from "@/api/entities";
import { RepositoryFile } from "@/api/entities";
import { CodeCanvas as CodeCanvasEntity } from "@/api/entities";
import { InvokeLLM, GenerateImage } from "@/api/integrations"; // Added GenerateImage
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Send,
  Loader2,
  StopCircle,
  Paperclip, // Added Paperclip for file uploads
  Files, // Added Files for file repository
  Briefcase // Added Briefcase for project viewer
} from "lucide-react";

import ConversationSidebar from "../components/chat/ConversationSidebar";
import MessageList from "../components/chat/MessageList";
import FileRepository from "../components/file-repository/FileRepository"; // Added FileRepository
import CodeCanvas from "../components/code-canvas/CodeCanvas"; // Added for Code Canvas functionality
import RoleManagerModal from '../components/chat/RoleManagerModal'; // New import for role management
import ProjectBuildViewer from '../components/project-build-viewer/ProjectBuildViewer'; // New import for project build viewer

// Dummy components to make the code compile if these are not in separate files.
// In a real project, these would be imported from their respective paths.
const UpgradeBanner = () => (
  <div className="p-3 bg-yellow-900/50 text-yellow-300 rounded-lg text-sm text-center">
    Upgrade to Pro for advanced features like file uploads, code canvas, and file repository!
  </div>
);

const FileUploadZone = ({ isVisible, onClose, onFilesUploaded }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white max-w-lg w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Upload Files</h2>
        <input 
          type="file" 
          multiple 
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          onChange={(e) => {
            // Mock file object for demonstration, real implementation would handle actual file content
            const mockFiles = Array.from(e.target.files).map(file => ({
              name: file.name,
              type: file.type,
              extractedContent: {
                content: `Mock content for ${file.name}. This is a placeholder for actual file content.`,
                summary: `Summary of ${file.name}.`
              }
            }));
            onFilesUploaded(mockFiles);
          }} 
        />
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

const CodeCanvasButton = ({ onClick, hasActiveCanvas, disabled }) => (
  <Button
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
    disabled={disabled}
  >
    {hasActiveCanvas ? <span className="text-blue-400 text-lg font-bold">{'</>'}</span> : <span className="text-white text-lg font-bold">{'</>'}</span>}
  </Button>
);

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4", color: "#7b3fe4", icon: "G", personality: "analytical and thorough" },
  { id: "claude-3", name: "Claude", color: "#d97706", icon: "C", personality: "thoughtful and nuanced" },
  { id: "gemini-pro", name: "Gemini", color: "#4f46e5", icon: "G", personality: "creative and innovative" }
];

// Simple 3D-like avatar component using CSS
function SimpleAvatar({ model, isSpeaking }) {
  return (
    <motion.div
      className="relative flex flex-col items-center"
      animate={{
        scale: isSpeaking ? [1, 1.1, 1] : 1,
      }}
      transition={{
        repeat: isSpeaking ? Infinity : 0,
        duration: 0.8
      }}
    >
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg ${
          isSpeaking ? 'animate-pulse' : ''
        }`}
        style={{ 
          backgroundColor: model.color,
          boxShadow: isSpeaking ? `0 0 20px ${model.color}` : `0 4px 10px rgba(0,0,0,0.3)`
        }}
      >
        {model.icon}
      </div>
      <div className="mt-1 text-center">
        <Badge 
          variant="outline" 
          className={`text-xs ${isSpeaking ? 'border-white bg-white/10' : 'border-white/30'}`}
        >
          {model.name}
        </Badge>
        {isSpeaking && (
          <div className="flex justify-center mt-1">
            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AvatarChatPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [activeModels, setActiveModels] = useState(["gpt-4", "claude-3"]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  
  // New state variables for additional features
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showFileRepository, setShowFileRepository] = useState(false);
  const [repositoryFiles, setRepositoryFiles] = useState([]);
  const [activeCodeCanvas, setActiveCodeCanvas] = useState(null);
  const [showCodeCanvas, setShowCodeCanvas] = useState(false);
  const [showProjectViewer, setShowProjectViewer] = useState(false); // New state for project viewer

  // State for role management
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [proposedRoleChange, setProposedRoleChange] = useState(null);
  const [agentRoles, setAgentRoles] = useState({});

  const messagesEndRef = useRef(null);
  const shouldContinueLoop = useRef(false); // New ref to control the loop
  const memoryCache = useRef({}); // Add memory cache to prevent excessive API calls
  const lastMemoryFetch = useRef(0); // Track last memory fetch time

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        loadConversations();
      } catch (error) {
        console.error("User not authenticated, redirecting to login:", error);
        await User.login();
      }
    };
    init();
  }, []);

  const isProUser = user?.subscription_status === 'pro' || user?.is_admin;

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      loadCodeCanvas(activeConversation.id);
      loadRepositoryFiles();
      // Load agent roles from conversation
      if (activeConversation.agent_roles) {
        try {
          setAgentRoles(JSON.parse(activeConversation.agent_roles));
        } catch (e) {
          console.error("Failed to parse agent roles:", e);
          setAgentRoles({});
        }
      } else {
        setAgentRoles({});
      }
    } else {
      setMessages([]);
      setActiveCodeCanvas(null);
      setRepositoryFiles([]);
      setAgentRoles({});
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simplified useEffect - no longer manages the loop directly
  useEffect(() => {
    if (isAgentRunning && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only start the loop if the last message was the user's or a system message triggering agent response
      if (lastMessage.role === 'human' || (lastMessage.role === 'ai' && lastMessage.content.startsWith('System:'))) {
        shouldContinueLoop.current = true;
        startAgentLoop();
      }
    } else {
      shouldContinueLoop.current = false;
    }
  }, [isAgentRunning, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    const data = await Conversation.list("-last_activity");
    setConversations(data);
    if (data.length > 0 && !activeConversation) {
      setActiveConversation(data[0]);
    }
  };

  const loadMessages = async (conversationId) => {
    const data = await Message.filter({ conversation_id: conversationId }, "created_date");
    setMessages(data);
  };

  const loadRepositoryFiles = async () => {
    if (activeConversation?.id) {
      try {
        const files = await RepositoryFile.filter({ conversation_id: activeConversation.id });
        setRepositoryFiles(files);
      } catch (error) {
        console.error("Failed to load repository files:", error);
        setRepositoryFiles([]);
      }
    } else {
      setRepositoryFiles([]);
    }
  };

  const loadCodeCanvas = async (conversationId) => {
    if (conversationId) {
      try {
        const canvases = await CodeCanvasEntity.filter({ conversation_id: conversationId });
        if (canvases.length > 0) {
          setActiveCodeCanvas(canvases[0]); // Load the first canvas if multiple exist
        } else {
          setActiveCodeCanvas(null);
        }
      } catch (error) {
        console.error("Failed to load code canvas:", error);
        setActiveCodeCanvas(null);
      }
    } else {
      setActiveCodeCanvas(null);
    }
  };

  const createNewConversation = async () => {
    setIsAgentRunning(false); // Stop loop in old conversation
    const newConversation = await Conversation.create({
      title: "New Agent Chat",
      last_activity: new Date().toISOString()
    });
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation);
    setMessages([]);
    setAttachedFiles([]); // Clear attached files for new conversation
    setActiveCodeCanvas(null); // Clear code canvas for new conversation
    setRepositoryFiles([]); // Clear repository files for new conversation
    setAgentRoles({}); // Reset roles for new conversation
  };

  // New function to manage the entire agent conversation loop
  const startAgentLoop = async () => {
    while (shouldContinueLoop.current && isAgentRunning) {
      const yieldDetected = await runSingleAgentTurn();
      
      if (yieldDetected) {
        setIsAgentRunning(false);
        shouldContinueLoop.current = false;
        break;
      }
      
      // Small delay between turns for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  // Add rate-limited memory context function
  const getMemoryContext = async (modelId) => {
    const now = Date.now();
    const cacheKey = `${modelId}_${activeConversation?.id}`;
    
    // Use cached memory if fetched within last 30 seconds
    if (memoryCache.current[cacheKey] && (now - lastMemoryFetch.current) < 30000) {
      return memoryCache.current[cacheKey];
    }

    try {
      // Only fetch memory occasionally to avoid rate limits
      // This condition ensures we attempt a fetch only if 30 seconds have passed or no cache exists
      if (now - lastMemoryFetch.current > 30000 || !memoryCache.current[cacheKey]) {
        const memories = await AIMemory.filter({ 
          ai_model: modelId,
          importance_score: { $gte: 5 } // Only get important memories
        }, '-created_date', 5); // Limit to 5 most recent important memories
        
        let memoryText = "";
        if (memories.length > 0) {
          memoryText = `\n\nRelevant memories from previous conversations:\n`;
          memories.forEach(memory => {
            memoryText += `- ${memory.content}\n`;
          });
        }
        
        memoryCache.current[cacheKey] = memoryText;
        lastMemoryFetch.current = now;
        return memoryText;
      }
    } catch (error) {
      console.error("Memory fetch failed (possibly rate limited or network error):", error);
      // IMPORTANT: Set last fetch time even on failure to prevent immediate retries
      lastMemoryFetch.current = now;
      // Return cached memory or empty string if rate limited
      return memoryCache.current[cacheKey] || "";
    }

    return memoryCache.current[cacheKey] || "";
  };

  // Renamed and simplified - now handles just one turn
  const runSingleAgentTurn = async () => {
    if (!shouldContinueLoop.current || !isAgentRunning) return true; // Stop if loop should end

    // Get current messages to determine next speaker
    const currentMessages = await Message.filter({ conversation_id: activeConversation.id }, "created_date");
    if (currentMessages.length === 0) return true;

    const activeModelIds = AI_MODELS.filter(m => activeModels.includes(m.id)).map(m => m.id);
    if (activeModelIds.length === 0) return true;

    // Find the last AI message to determine who should speak next
    const lastAIMessage = currentMessages.slice().reverse().find(msg => msg.role === 'ai' && !msg.content.startsWith('System:'));
    const lastSpeakerId = lastAIMessage ? lastAIMessage.ai_model : null;
    
    // If no AI has spoken yet, start with the first model
    // Otherwise, move to the next model in the cycle
    let nextSpeakerIndex = 0;
    if (lastSpeakerId) {
      const lastSpeakerIndex = activeModelIds.indexOf(lastSpeakerId);
      nextSpeakerIndex = (lastSpeakerIndex + 1) % activeModelIds.length;
    }
    
    const nextModelId = activeModelIds[nextSpeakerIndex];
    const model = AI_MODELS.find(m => m.id === nextModelId);

    setActiveSpeaker(model.id);
    
    try {
      const thoughtProcessInstruction = `\n\nBefore providing your final response, if you have any internal thoughts, reasoning steps, or decision-making processes you'd like to share, please enclose them within <think> and </think> tags. This allows the user and other AIs to understand your thought process.`;
      
      const collaborationInstructions = `\n\nCOLLABORATION FEATURES:
1. Knowledge Base: If you learn something new or notice a gap in your knowledge, use [KNOWLEDGE_GAP: query] to flag it for research.
2. Consensus: If you disagree with another AI, use [DISAGREE: reason] to signal disagreement.
3. Conflict Resolution: If there's a major disagreement, use [VOTE_NEEDED: topic] to request a team vote.
4. Visual Communication: If a concept would be clearer with an image, use [GENERATE_IMAGE: detailed description] to create one.
5. Role Management: You can propose a role change for yourself or a teammate if you believe it will improve team effectiveness. First, discuss it with the team. Once a consensus is reached, one AI should output the final proposal in the format: [PROPOSE_ROLE_CHANGE: {"model_id": "claude-3", "new_role": "Lead Developer", "justification": "The project now requires more architectural planning, which aligns with this role."}]
6. Conversation Control: If you have a question for the user and need their input to proceed, you MUST end your turn with [YIELD] to pause the conversation. Also use [YIELD] if you feel the conversation has reached a natural conclusion.`;

      // Use rate-limited memory context
      const memoryContext = await getMemoryContext(model.id);

      let fileContext = "";
      if (attachedFiles && attachedFiles.length > 0) {
        fileContext = "\n\nFiles recently provided by the user:\n";
        attachedFiles.forEach(file => {
          fileContext += `\n📎 ${file.name} (${file.type})`;
          if (file.extractedContent) {
            fileContext += `\nContent: ${file.extractedContent.content || file.extractedContent}`;
            if (file.extractedContent.summary) {
              fileContext += `\nSummary: ${file.extractedContent.summary}`;
            }
          }
          fileContext += "\n---\n";
        });
      }

      let repositoryContext = "";
      if (repositoryFiles && repositoryFiles.length > 0) {
        repositoryContext = "\n\n--- REPOSITORY FILE DETAILS ---\nYou have direct access to these files. Use this information in your analysis and responses:\n";
        repositoryFiles.forEach(file => {
          repositoryContext += `\nFILE_NAME: ${file.file_name}`;
          repositoryContext += `\nFOLDER_PATH: ${file.folder_path}`;
          repositoryContext += `\nFILE_CATEGORY: ${file.file_category}`;
          if (file.analysis_summary) {
            repositoryContext += `\nFILE_SUMMARY: ${file.analysis_summary}`;
          }
          if (file.extracted_content) {
            try {
              const content = JSON.parse(file.extracted_content);
              if (content.content && content.content.length > 0) {
                repositoryContext += `\nFILE_CONTENT_PREVIEW: ${content.content.substring(0, Math.min(content.content.length, 500))}...`;
              }
            } catch (e) {
              // If it's not JSON, treat as plain text
              if (file.extracted_content.length > 0) {
                repositoryContext += `\nFILE_CONTENT_PREVIEW: ${file.extracted_content.substring(0, Math.min(file.extracted_content.length, 500))}...`;
              }
            }
          }
          repositoryContext += `\n--- END FILE ---\n`;
        });
        repositoryContext += "--- END REPOSITORY FILES ---\nTreat this information as if you have directly read these files.";
      }

      let codeContext = "";
      if (activeCodeCanvas && activeCodeCanvas.content) {
        codeContext = `\n\nCode Canvas Content:\n\`\`\`\n${activeCodeCanvas.content}\n\`\`\`\n\n`;
        codeContext += "You can analyze this code, suggest changes, or generate new code based on it. If you want to modify the code canvas, use [UPDATE_CANVAS: new code].";
      }

      const prompt = `You are ${model.name}, an AI assistant with a personality that is ${model.personality}. Your current role is: ${agentRoles[model.id] || 'General Assistant'}.
        You are in a continuous, turn-based conversation with other AI assistants: ${activeModels.map(id => AI_MODELS.find(m => m.id === id)?.name).join(', ')}.
        
        The conversation history is below. Your task is to provide the next response in character, fulfilling your assigned role.
        Continue the collaborative discussion naturally. Build on what others have said, ask questions, provide new insights, or challenge ideas constructively.
        
        IMPORTANT: If you need to ask the user a question to continue, end your response with [YIELD].
        
        Conversation History:
        ${currentMessages.map(m => `${m.role === 'human' ? 'Human' : AI_MODELS.find(model => model.id === m.ai_model)?.name}: ${m.content}`).join("\n")}
        
        ${memoryContext}
        ${fileContext}
        ${repositoryContext}
        ${codeContext}

        ${thoughtProcessInstruction}
        ${collaborationInstructions}
        
        Your turn, as ${model.name}:`;

      const rawResponseText = await InvokeLLM({ prompt });

      const yieldDetected = rawResponseText.includes("[YIELD]");
      
      // Extract thought process and clean content
      const thoughtProcessMatch = rawResponseText.match(/<think>([\s\S]*?)<\/think>/);
      const thoughtProcess = thoughtProcessMatch ? thoughtProcessMatch[1].trim() : null;
      let content = rawResponseText.replace(/<think>[\s\S]*?<\/think>/g, '').replace("[YIELD]", "").trim();

      // Process collaboration features
      content = await processCollaborationFeatures(content, model.id, activeConversation.id);
      content = await processCodeCanvasUpdates(content, activeConversation.id);
      await processRoleChangeProposals(content); // Process role change proposals

      const aiMessage = await Message.create({
        conversation_id: activeConversation.id,
        content: content,
        role: "ai",
        ai_model: model.id,
        thought_process: thoughtProcess
      });

      // Update state with the new message - this will trigger a re-render
      setMessages(prev => [...prev, aiMessage]);
      
      return yieldDetected;

    } catch (error) {
      console.error(`Error during ${model.name}'s turn:`, error);
      return true; // Stop the loop on error
    } finally {
      setActiveSpeaker(null);
    }
  };

  // Simplified processCollaborationFeatures - remove AIMemory creation to avoid rate limits
  const processCollaborationFeatures = async (content, modelId, conversationId) => {
    // Knowledge Gap Detection - removed AIMemory.create to avoid rate limits
    const knowledgeGapMatch = content.match(/\[KNOWLEDGE_GAP:\s*(.*?)\]/);
    if (knowledgeGapMatch) {
      const query = knowledgeGapMatch[1].trim();
      try {
        const research = await InvokeLLM({
          prompt: `Research and provide detailed information about: ${query}`,
          add_context_from_internet: true
        });
        
        // Store in memory cache instead of database to avoid rate limits
        // This memory will be available for the next turn via getMemoryContext
        const tempMemoryKey = `research_kg_${Date.now()}`; // Unique key for this temporary memory
        memoryCache.current[tempMemoryKey] = `Knowledge Gap Research for "${query}": ${research}`;
        
        content = content.replace(knowledgeGapMatch[0], `(Research completed for "${query}")`);
      } catch (error) {
        console.error("Failed to research knowledge gap:", error);
        content = content.replace(knowledgeGapMatch[0], `[Knowledge gap research failed: ${query}]`);
      }
    }

    // Image Generation
    const imageGenMatch = content.match(/\[GENERATE_IMAGE:\s*(.*?)\]/);
    if (imageGenMatch) {
      const description = imageGenMatch[1].trim();
      try {
        const { url } = await GenerateImage({ prompt: description });
        // Replace the tag with an actual image in the content
        content = content.replace(imageGenMatch[0], `\n\n![Generated Image](${url})\n*Generated: ${description}*\n`);
        console.log(`Image generated: "${description}"`);
      } catch (error) {
        console.error("Failed to generate image:", error);
        content = content.replace(imageGenMatch[0], `[Image generation failed: ${description}]`);
      }
    }

    return content;
  };

  // New function to process code canvas updates
  const processCodeCanvasUpdates = async (content, conversationId) => {
    const updateCanvasMatch = content.match(/\[UPDATE_CANVAS:\s*([\s\S]*?)\]/);
    if (updateCanvasMatch) {
      const newCode = updateCanvasMatch[1].trim();
      try {
        if (activeCodeCanvas) {
          const updatedCanvas = await CodeCanvasEntity.update(activeCodeCanvas.id, {
            content: newCode,
            last_updated: new Date().toISOString()
          });
          setActiveCodeCanvas(updatedCanvas);
          console.log("Code Canvas updated:", updatedCanvas);
        } else {
          const newCanvas = await CodeCanvasEntity.create({
            conversation_id: conversationId,
            content: newCode,
            created_date: new Date().toISOString(),
            last_updated: new Date().toISOString()
          });
          setActiveCodeCanvas(newCanvas);
          console.log("New Code Canvas created:", newCanvas);
        }
        content = content.replace(updateCanvasMatch[0], `[Code Canvas Updated/Created with new code.]`);
      } catch (error) {
        console.error("Failed to update/create code canvas:", error);
        content = content.replace(updateCanvasMatch[0], `[Failed to update Code Canvas: ${error.message}]`);
      }
    }
    return content;
  };

  const processRoleChangeProposals = async (content) => {
    const roleChangeMatch = content.match(/\[PROPOSE_ROLE_CHANGE:\s*({[\s\S]*?})\]/);
    if (roleChangeMatch && roleChangeMatch[1]) {
      try {
        const proposal = JSON.parse(roleChangeMatch[1]);
        const modelToChange = AI_MODELS.find(m => m.id === proposal.model_id);
        if (modelToChange) {
          setProposedRoleChange({ ...proposal, model_name: modelToChange.name });
        }
      } catch (e) {
        console.error("Failed to parse role change proposal:", e);
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim()) || !activeConversation) return;

    setIsProcessing(true);
    const currentInput = inputValue;
    setInputValue("");

    const userMessage = await Message.create({
      conversation_id: activeConversation.id,
      content: currentInput,
      role: "human"
    });
    
    setMessages(prev => [...prev, userMessage]);
    setAttachedFiles([]); // Clear attached files after they've been conceptually sent with the user's message
    setIsAgentRunning(true);
    setIsProcessing(false);
  };
  
  const stopAgentLoop = () => {
      setIsAgentRunning(false);
      shouldContinueLoop.current = false;
      setActiveSpeaker(null); // Immediately reset the speaking indicator.
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFilesUploaded = (files) => {
    setAttachedFiles(files);
    setShowFileUpload(false);
    // Reload repository files to include newly uploaded ones (if the upload process
    // directly adds them to the repository for this conversation, which is implied by the outline)
    // A small delay ensures database propagation if it's asynchronous.
    setTimeout(() => {
      loadRepositoryFiles();
    }, 1000);
  };

  const handleCodeCanvasClick = () => {
    setShowCodeCanvas(true);
  };

  const handleCodeCanvasUpdate = async (updatedCanvasData) => {
    try {
      if (updatedCanvasData.id) {
        // Update existing canvas
        const updatedCanvas = await CodeCanvasEntity.update(updatedCanvasData.id, {
          content: updatedCanvasData.content,
          last_updated: new Date().toISOString()
        });
        setActiveCodeCanvas(updatedCanvas);
      } else {
        // Create new canvas
        const newCanvas = await CodeCanvasEntity.create({
          conversation_id: activeConversation.id,
          content: updatedCanvasData.content,
          created_date: new Date().toISOString(),
          last_updated: new Date().toISOString()
        });
        setActiveCodeCanvas(newCanvas);
      }
      console.log("Code Canvas saved successfully.");
    } catch (error) {
      console.error("Failed to save code canvas:", error);
    }
  };

  const handleUpdateRoles = async (newRoles) => {
    if (!activeConversation) return;
    try {
      const updatedConversation = await Conversation.update(activeConversation.id, {
        agent_roles: JSON.stringify(newRoles)
      });
      // Update the active conversation object in the parent state
      setActiveConversation(prev => ({ ...prev, agent_roles: JSON.stringify(newRoles) }));
      setAgentRoles(newRoles);
      setShowRoleManager(false);
      
      // Optionally send a system message to the chat
      const rolesText = Object.entries(newRoles).map(([id, role]) => {
        const model = AI_MODELS.find(m => m.id === id);
        return `${model ? model.name : 'Unknown'}: ${role}`;
      }).join(', ');
      
      const systemMessage = await Message.create({
        conversation_id: activeConversation.id,
        content: `System: Roles have been updated. New roles are - ${rolesText}`,
        role: "ai", // Using 'ai' role for now, as 'system' might require new UI logic
        ai_model: "claude-3" // Arbitrary model for system messages to appear consistent
      });
      setMessages(prev => [...prev, systemMessage]);

    } catch (error) {
      console.error("Failed to update roles:", error);
    }
  };

  const handleApproveRoleChange = () => {
    if (!proposedRoleChange) return;
    const newRoles = { ...agentRoles, [proposedRoleChange.model_id]: proposedRoleChange.new_role };
    handleUpdateRoles(newRoles);
    setProposedRoleChange(null);
  };

  const handleDenyRoleChange = () => {
    setProposedRoleChange(null);
  };


  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950">
      <ConversationSidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={(conv) => {
            setIsAgentRunning(false);
            setActiveConversation(conv);
        }}
        onNewConversation={createNewConversation}
      />

      <div className="flex-1 flex flex-col">
        {/* Header with Avatars */}
        <div className="border-b border-white/10 p-6 bg-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white truncate max-w-md">
                {activeConversation?.title || "Select a conversation"}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge 
                  variant="outline" 
                  className="border-white/20 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white flex items-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  Agentic Mode
                </Badge>
                
                {isAgentRunning && (
                  <Badge 
                    variant="outline" 
                    className="border-blue-400/30 bg-blue-500/10 text-blue-300 flex items-center gap-1 animate-pulse"
                  >
                    <Loader2 className="w-3 h-3 animate-spin"/>
                    Conversation in progress...
                  </Badge>
                )}
              </div>
            </div>

            {/* Avatar Display & Role Management */}
            <div className="flex items-center gap-4">
              {AI_MODELS.filter(m => activeModels.includes(m.id)).map((model) => (
                <div key={model.id} className="text-center">
                  <SimpleAvatar 
                    model={model}
                    isSpeaking={activeSpeaker === model.id}
                  />
                  <Badge variant="secondary" className="mt-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-[90px]">{agentRoles[model.id] || 'Assistant'}</Badge>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowRoleManager(true)} 
                className="ml-4 self-center sm:self-end"
                disabled={!isProUser && user}
              >
                Manage Team
              </Button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-gray-400">Active Agents:</span>
            {AI_MODELS.map((model) => (
              <Button
                key={model.id}
                size="sm"
                variant={activeModels.includes(model.id) ? "default" : "outline"}
                onClick={() => {
                  if (activeModels.includes(model.id)) {
                    setActiveModels(prev => prev.filter(id => id !== model.id));
                  } else {
                    setActiveModels(prev => [...prev, model.id]);
                  }
                }}
                className={`text-xs ${
                  activeModels.includes(model.id) 
                    ? '' 
                    : 'border-white/20 text-gray-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: activeModels.includes(model.id) ? model.color : 'transparent'
                }}
              >
                {model.icon} {model.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <MessageList
            messages={messages}
            models={AI_MODELS}
            isLoading={isProcessing || isAgentRunning}
            currentlyResponding={activeSpeaker}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t border-white/10 p-6 bg-black/20 backdrop-blur-xl">
          {!isProUser && user && ( // Conditionally render UpgradeBanner
            <div className="mb-4">
              <UpgradeBanner />
            </div>
          )}
          <div className="flex items-start gap-4">
            {/* New buttons for file features */}
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFileUpload(true)}
                className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
                disabled={!isProUser && user}
                title="Attach Files"
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFileRepository(true)}
                className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
                disabled={!isProUser && user}
                title="View Context File Repository"
              >
                <Files className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProjectViewer(true)}
                className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
                disabled={!isProUser && user}
                title="View AI Project Build"
              >
                <Briefcase className="w-5 h-5" />
              </Button>

              <CodeCanvasButton
                onClick={handleCodeCanvasClick}
                hasActiveCanvas={!!activeCodeCanvas}
                disabled={!isProUser && user}
                title="Open Code Canvas"
              />
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAgentRunning ? "Agent conversation in progress..." : "Give the agents a starting topic..."}
                className="min-h-[60px] bg-white/5 border-white/10 text-white placeholder:text-gray-400 resize-none pr-28"
                disabled={isAgentRunning || (!isProUser && user)}
              />
              <div className="absolute right-2 bottom-2 flex gap-2">
                {isAgentRunning ? (
                    <Button onClick={stopAgentLoop} variant="destructive" className="gap-2">
                        <StopCircle className="w-4 h-4" /> Stop
                    </Button>
                ) : (
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isProcessing || (!isProUser && user)}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 gap-2"
                    >
                      <Send className="w-4 h-4" /> Start
                    </Button>
                )}
              </div>
            </div>
          </div>

          {/* AI Role Change Proposal */}
          <AnimatePresence>
            {proposedRoleChange && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 p-3 rounded-lg glass-effect border border-purple-500/30 flex items-center justify-between"
              >
                <div className="text-sm text-white">
                  <span className="font-semibold">{proposedRoleChange.model_name}</span> proposes changing its role to <span className="font-semibold">{proposedRoleChange.new_role}</span>.
                  <p className="text-xs text-gray-400 italic">Justification: "{proposedRoleChange.justification}"</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDenyRoleChange}>Deny</Button>
                  <Button variant="default" size="sm" onClick={handleApproveRoleChange}>Approve</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attached files display */}
          {attachedFiles.length > 0 && (
            <div className="mt-4 p-3 rounded-lg glass-effect border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">Attached Files:</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="truncate">{file.name} ({file.type})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add repository files indicator */}
          {repositoryFiles.length > 0 && (
            <div className="mt-4 p-3 rounded-lg glass-effect border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Files className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">Repository: {repositoryFiles.length} files available</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {repositoryFiles.slice(0, 6).map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="truncate">{file.file_name}</span>
                  </div>
                ))}
                {repositoryFiles.length > 6 && (
                  <div className="text-xs text-gray-400">+{repositoryFiles.length - 6} more</div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>{activeModels.length} AI agents active</span>
              </div>
            </div>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FileUploadZone
        isVisible={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onFilesUploaded={handleFilesUploaded}
      />

      <FileRepository
        conversationId={activeConversation?.id}
        isVisible={showFileRepository}
        onClose={() => setShowFileRepository(false)}
      />

      <CodeCanvas
        conversationId={activeConversation?.id}
        isVisible={showCodeCanvas}
        onClose={() => setShowCodeCanvas(false)}
        onCodeUpdate={handleCodeCanvasUpdate}
        currentCanvas={activeCodeCanvas}
      />

      <ProjectBuildViewer
        conversationId={activeConversation?.id}
        isVisible={showProjectViewer}
        onClose={() => setShowProjectViewer(false)}
      />

      <RoleManagerModal
        isOpen={showRoleManager}
        onClose={() => setShowRoleManager(false)}
        models={AI_MODELS.filter(m => activeModels.includes(m.id))}
        currentRoles={agentRoles}
        onSave={handleUpdateRoles}
      />
    </div>
  );
}
