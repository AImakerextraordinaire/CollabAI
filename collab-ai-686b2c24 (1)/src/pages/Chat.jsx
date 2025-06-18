
import React, { useState, useEffect, useRef } from "react";
import { Conversation, Message, ChatFile, CodeCanvas as CodeCanvasEntity, ToolConfiguration, AIToolSchema, User, AIMemory, RepositoryFile } from "@/api/entities"; // Added AIMemory, RepositoryFile
import { InvokeLLM, GenerateImage } from "@/api/integrations"; // Added GenerateImage
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Plus, RotateCcw, Users, Paperclip, Brain, Code, Files, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';

import ConversationSidebar from "../components/chat/ConversationSidebar";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import FileUploadZone from "../components/chat/FileUploadZone";
import MemoryManager from "../components/chat/MemoryManager";
import CodeCanvas from "../components/code-canvas/CodeCanvas";
import CodeCanvasButton from "../components/code-canvas/CodeCanvasButton";
import FileRepository from "../components/file-repository/FileRepository";
import { executeToolCall } from "@/api/functions";
import TeamFormationModal from "../components/chat/TeamFormationModal";

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4", color: "from-green-400 to-emerald-500", icon: "G", personality: "analytical and thorough" },
  { id: "claude-3", name: "Claude", color: "from-orange-400 to-red-500", icon: "C", personality: "thoughtful and nuanced" },
  { id: "gemini-pro", name: "Gemini", color: "from-blue-400 to-purple-500", icon: "G", personality: "creative and innovative" }
];

const UpgradeBanner = () => (
    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
        <h4 className="font-bold text-yellow-400 flex items-center justify-center gap-2"><Lock className="w-4 h-4"/> Pro Feature</h4>
        <p className="text-sm text-gray-300 mt-1">
            Please upgrade to a Pro plan to use collaborative chat, code canvas, and custom tools.
        </p>
        <Link to="/billing">
            <Button size="sm" className="mt-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                Upgrade Now
            </Button>
        </Link>
    </div>
);

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [activeModels, setActiveModels] = useState(["gpt-4", "claude-3"]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyResponding, setCurrentlyResponding] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [memoryManagers, setMemoryManagers] = useState({});
  const messagesEndRef = useRef(null);

  const [showCodeCanvas, setShowCodeCanvas] = useState(false);
  const [activeCodeCanvas, setActiveCodeCanvas] = useState(null);
  const [showFileRepository, setShowFileRepository] = useState(false);
  const [repositoryFiles, setRepositoryFiles] = useState([]);

  const [toolConfigs, setToolConfigs] = useState([]);
  const [toolSchemas, setToolSchemas] = useState([]);
  
  const [user, setUser] = useState(null);

  const [showTeamFormation, setShowTeamFormation] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");

  useEffect(() => {
    const init = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            loadConversations();
            initializeMemoryManagers();
            loadTools();
            loadRepositoryFiles();
        } catch (error) {
            console.error("User not authenticated, redirecting to login:", error);
            await User.login();
        }
    };
    init();
  }, []);

  const isProUser = user?.subscription_status === 'pro' || user?.is_admin;

  const loadTools = async () => {
    const configs = await ToolConfiguration.filter({ is_active: true });
    const schemas = await AIToolSchema.filter({ is_enabled: true });
    setToolConfigs(configs);
    setToolSchemas(schemas);
  };

  const loadCodeCanvas = async (conversationId) => {
    try {
      const canvases = await CodeCanvasEntity.filter(
        { conversation_id: conversationId, is_active: true },
        "-version"
      );
      if (canvases.length > 0) {
        setActiveCodeCanvas(canvases[0]);
      } else {
        setActiveCodeCanvas(null);
      }
    } catch (error) {
      console.log("No code canvas found for this conversation. Error:", error);
      setActiveCodeCanvas(null);
    }
  };

  // Add function to load repository files
  const loadRepositoryFiles = async () => {
    if (activeConversation?.id) {
      try {
        const files = await RepositoryFile.filter({ conversation_id: activeConversation.id });
        setRepositoryFiles(files);
      } catch (error) {
        console.error("Failed to load repository files:", error);
        setRepositoryFiles([]);
      }
    }
  };

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      loadCodeCanvas(activeConversation.id);
      loadRepositoryFiles();
    } else {
      setMessages([]);
      setActiveCodeCanvas(null);
      setRepositoryFiles([]);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeMemoryManagers = () => {
    const managers = {};
    AI_MODELS.forEach(model => {
      managers[model.id] = new MemoryManager(model.id);
    });
    setMemoryManagers(managers);
  };

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

  const createNewConversation = async () => {
    const newConversation = await Conversation.create({
      title: "New Collaboration",
      last_activity: new Date().toISOString()
    });
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation);
    setMessages([]);
    setActiveCodeCanvas(null);
  };

  const handleFilesUploaded = (files) => {
    setAttachedFiles(files);
    setShowFileUpload(false);
    // Reload repository files to include newly uploaded ones
    setTimeout(() => {
      loadRepositoryFiles();
    }, 1000);
  };

  const buildCollaborativePrompt = async (modelName, modelPersonality, conversationHistory, attachedFiles, isFirstResponse) => {
    const recentHistory = conversationHistory.slice(-10);

    let historyText = recentHistory.map(msg => {
      if (msg.role === 'human') return `Human: ${msg.content}`;
      const modelInfo = AI_MODELS.find(m => m.id === msg.ai_model);
      return `${modelInfo?.name || 'AI'}: ${msg.content}`;
    }).join('\n\n');

    const currentQuery = conversationHistory[conversationHistory.length - 1]?.content || "";
    const modelIdForMemory = AI_MODELS.find(m => m.name === modelName)?.id;
    const memoryManagerInstance = memoryManagers[modelIdForMemory];
    const memoryContext = memoryManagerInstance ? await memoryManagerInstance.getEnhancedContext(currentQuery, recentHistory) : "";

    let fileContext = "";
    if (attachedFiles && attachedFiles.length > 0) {
      fileContext = "\n\nFiles shared by the user:\n";
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

    let codeContext = "";
    if (activeCodeCanvas) {
      codeContext = `\n\nShared Code Canvas:
Title: ${activeCodeCanvas.title}
Language: ${activeCodeCanvas.language}
Description: ${activeCodeCanvas.description}

Current Code:
\`\`\`${activeCodeCanvas.language}
${activeCodeCanvas.code_content}
\`\`\`

You can suggest modifications to this code by describing the changes needed. If you want to propose code changes, explain them clearly.`;
    }

    // Add repository files context
    let repositoryContext = "";
    if (repositoryFiles && repositoryFiles.length > 0) {
      repositoryContext = "\n\nAvailable files in the project repository. Use this information directly in your analysis and responses:\n";
      repositoryFiles.forEach(file => {
        repositoryContext += `\n📁 ${file.folder_path}/${file.file_name} (${file.file_category})`;
        if (file.analysis_summary) {
          repositoryContext += `\nSummary: ${file.analysis_summary}`;
        }
        if (file.extracted_content) {
          try {
            const content = JSON.parse(file.extracted_content);
            if (content.content && content.content.length < 1000) {
              repositoryContext += `\nContent preview: ${content.content.substring(0, 500)}...`;
            }
          } catch (e) {
            if (file.extracted_content.length < 1000) {
              repositoryContext += `\nContent preview: ${file.extracted_content.substring(0, 500)}...`;
            }
          }
        }
        repositoryContext += `\nFile URL: ${file.file_url}\n---\n`;
      });
      repositoryContext += "\nYou can reference these files by their paths and analyze their content based on the previews provided.";
    }

    let toolContext = "";
    const modelId = AI_MODELS.find(m => m.name === modelName)?.id;
    if (modelId) {
      const availableSchemas = toolSchemas.filter(s => s.ai_model === modelId);
      if (availableSchemas.length > 0) {
        toolContext += "\n\nYou have access to the following tools. To use a tool, respond ONLY with a JSON object containing a 'tool_calls' key. The value should be an array of objects, each with 'name' and 'arguments'.\n";
        toolContext += "Example: {\"tool_calls\": [{\"name\": \"tool_name\", \"arguments\": {\"arg1\": \"value1\"}}]}\n\n";

        availableSchemas.forEach(schema => {
          const config = toolConfigs.find(c => c.id === schema.tool_config_id);
          if(config) {
            toolContext += `\n- Tool: ${schema.tool_name}\n`;
            toolContext += `  Description: ${schema.description}\n`;
            toolContext += `  Parameters: ${schema.parameters_schema}\n`;
          }
        });
      }
    }
    
    let roleContext = "";
    if (activeConversation?.agent_roles) {
      try {
        const roles = JSON.parse(activeConversation.agent_roles);
        const modelId = AI_MODELS.find(m => m.name === modelName)?.id;
        if (roles[modelId]) {
          roleContext = `\n\nYour assigned role for this project is: **${roles[modelId]}**. Please respond from this perspective.`;
        }
      } catch (e) {
        console.error("Failed to parse agent_roles:", e);
      }
    }

    const thoughtProcessInstruction = `\n\nBefore providing your final response, if you have any internal thoughts, reasoning steps, or decision-making processes you'd like to share, please enclose them within <think> and </think> tags. This allows the user and other AIs to understand your thought process.`;

    const collaborationInstructions = `\n\nCOLLABORATION FEATURES:
1. Knowledge Base: If you learn something new or notice a gap in your knowledge, use [KNOWLEDGE_GAP: query] to flag it for research.
2. Consensus: If you disagree with another AI, use [DISAGREE: reason] to signal disagreement.
3. Conflict Resolution: If there's a major disagreement, use [VOTE_NEEDED: topic] to request a team vote.
4. Visual Communication: If a concept would be clearer with an image, use [GENERATE_IMAGE: detailed description] to create one.
5. Role Suggestions: If you think roles should be reassigned, use [SUGGEST_ROLES: reasoning] followed by your suggestions.`;

    if (isFirstResponse) {
      return `You are ${modelName}, an AI assistant known for being ${modelPersonality}. You're collaborating with other AI assistants in a group discussion.${roleContext}
${toolContext}${memoryContext}
The human has shared a message${attachedFiles?.length ? ' with attached files' : ''}${activeCodeCanvas ? ' and there is a shared code canvas' : ''}${repositoryFiles?.length ? ' and there are files in the project repository' : ''}. Please provide your initial analysis and perspective.
${fileContext}${codeContext}${repositoryContext}
Current conversation:
${historyText}
${thoughtProcessInstruction}
${collaborationInstructions}
Provide a thoughtful response as ${modelName}:`;
    } else {
      return `You are ${modelName}, an AI assistant known for being ${modelPersonality}. You're in an ongoing group discussion with other AI assistants and a human.${roleContext}
${toolContext}${memoryContext}
Please read the entire conversation${attachedFiles?.length ? ', analyze the shared files' : ''}${activeCodeCanvas ? ', and consider the shared code canvas' : ''}${repositoryFiles?.length ? ', and review the project repository files' : ''} and provide your perspective. You can:
- Build upon ideas from other AIs
- Offer a different viewpoint on the files${activeCodeCanvas ? ' or code' : ''}${repositoryFiles?.length ? ' or repository contents' : ''}
- Ask clarifying questions
- Synthesize what's been discussed
- Introduce new relevant angles
${activeCodeCanvas ? '- Suggest improvements or modifications to the code' : ''}
- Use available tools to fetch data or perform actions.
${fileContext}${codeContext}${repositoryContext}
Current conversation:
${historyText}
${thoughtProcessInstruction}
${collaborationInstructions}
What's your contribution to this discussion as ${modelName}?`;
    }
  };

  const startConversation = async (roles) => {
    if (!activeConversation) return;

    await Conversation.update(activeConversation.id, { agent_roles: JSON.stringify(roles) });
    
    const updatedConv = await Conversation.get(activeConversation.id);
    setActiveConversation(updatedConv);

    setShowTeamFormation(false);

    await sendMessage(initialPrompt, true);
    setInitialPrompt("");
  };

  const handleSendMessage = async () => {
    if (messages.length === 0 && activeConversation && !activeConversation.agent_roles && (inputValue.trim() || attachedFiles.length > 0)) {
      setInitialPrompt(inputValue);
      setShowTeamFormation(true);
    } else {
      await sendMessage(inputValue);
    }
  };

  const sendMessage = async (prompt, isFirstMessageAfterFormation = false) => {
    if ((!prompt.trim() && attachedFiles.length === 0) || !activeConversation || activeModels.length === 0 || !isProUser) return;

    const userMessage = await Message.create({
      conversation_id: activeConversation.id,
      content: prompt || (attachedFiles.length > 0 ? "📎 Files shared" : ""),
      role: "human"
    });

    const savedFiles = [];
    if (attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        const chatFile = await ChatFile.create({
          conversation_id: activeConversation.id,
          message_id: userMessage.id,
          file_name: file.name,
          file_url: file.url,
          file_type: file.type,
          file_size: file.size,
          extracted_content: file.extractedContent ? JSON.stringify(file.extractedContent) : null,
          analysis_summary: file.extractedContent?.summary || null
        });
        savedFiles.push(file);
      }
    }

    let currentHistory = [...messages, { ...userMessage, attachedFiles: savedFiles }];
    setMessages(currentHistory);

    if (isFirstMessageAfterFormation) {
        const updatedConv = await Conversation.get(activeConversation.id);
        setActiveConversation(updatedConv);
    }
    
    const currentInput = prompt;
    const currentFiles = [...attachedFiles];
    setInputValue("");
    setAttachedFiles([]);
    setIsLoading(true);

    const promptGroupId = Date.now().toString();
    const modelsToQuery = AI_MODELS.filter(m => activeModels.includes(m.id));

    let historyForTurn = currentHistory;

    for (let i = 0; i < modelsToQuery.length; i++) {
      const model = modelsToQuery[i];
      await runModelTurn(model, historyForTurn, currentFiles, userMessage.id, promptGroupId, (updatedHistory) => {
        historyForTurn = updatedHistory;
        setMessages(updatedHistory);
      });
    }

    for (const model of modelsToQuery) {
      const memoryManager = memoryManagers[model.id];
      if (memoryManager) {
        setTimeout(() => {
          memoryManager.processConversationEnd(activeConversation.id, currentHistory);
        }, 1000);
      }
    }

    setCurrentlyResponding(null);
    setIsLoading(false);

    if (messages.length === 0) {
      const title = currentInput ? currentInput.substring(0, 50) + (currentInput.length > 50 ? "..." : "") : "File Analysis";
      await Conversation.update(activeConversation.id, {
        title,
        last_activity: new Date().toISOString()
      });
      loadConversations();
    }
  };

  const runModelTurn = async (model, history, files, userMessageId, promptGroupId, updateHistoryCallback, maxToolCalls = 3) => {
    setCurrentlyResponding(model.id);
    let currentHistory = [...history];
    let toolCallCount = 0;

    while(toolCallCount < maxToolCalls) {
        try {
            const aiMessagesInGroup = currentHistory.filter(m => m.prompt_group_id === promptGroupId && m.role === 'ai');
            const isFirstResponse = aiMessagesInGroup.length === 0;

            const startTime = Date.now();
            const rawResponseText = await InvokeLLM({
              prompt: await buildCollaborativePrompt(model.name, model.personality, currentHistory, files, isFirstResponse),
            });
            const responseTime = Date.now() - startTime;

            const thoughtProcessMatch = rawResponseText.match(/<think>([\s\S]*?)<\/think>/);
            const thoughtProcess = thoughtProcessMatch ? thoughtProcessMatch[1].trim() : null;
            let content = rawResponseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

            content = await processCollaborationFeatures(content, model.id, activeConversation.id);

            let toolCalls;
            try {
              const parsedResponse = JSON.parse(content);
              if(parsedResponse.tool_calls) {
                toolCalls = parsedResponse.tool_calls;
              }
            } catch(e) {
                toolCalls = null;
            }

            if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
                const toolCallRequestMessage = await Message.create({
                  conversation_id: activeConversation.id,
                  content: `${model.name} is using a tool...`,
                  role: "ai",
                  ai_model: model.id,
                  parent_message_id: userMessageId,
                  prompt_group_id: promptGroupId,
                  tool_calls: JSON.stringify(toolCalls),
                  response_time: responseTime,
                  thought_process: thoughtProcess
                });

                currentHistory.push(toolCallRequestMessage);
                updateHistoryCallback(currentHistory);

                const toolCall = toolCalls[0];
                const schema = toolSchemas.find(s => s.tool_name === toolCall.name && s.ai_model === model.id);
                const config = toolConfigs.find(c => c.id === schema?.tool_config_id);

                if (schema && config) {
                    const { data: toolResultData, error: toolError } = await executeToolCall({
                        toolConfigId: config.id,
                        endpointPath: schema.endpoint_path,
                        method: schema.http_method,
                        parameters: toolCall.arguments
                    });

                    const toolOutputContent = toolError ?
                      `Error executing tool ${toolCall.name}: ${toolError.message || JSON.stringify(toolError)}` :
                      JSON.stringify({ tool_name: toolCall.name, result: toolResultData });

                    const toolResultMessage = await Message.create({
                        conversation_id: activeConversation.id,
                        content: toolOutputContent,
                        role: "tool",
                        parent_message_id: userMessageId,
                        prompt_group_id: promptGroupId,
                        tool_name: toolCall.name
                    });

                    currentHistory.push(toolResultMessage);
                    updateHistoryCallback(currentHistory);
                    toolCallCount++;
                } else {
                    const errorMessage = await Message.create({
                        conversation_id: activeConversation.id,
                        content: `I tried to use a tool called "${toolCall.name}" but I couldn't find its configuration or it's not available for me. Please ensure it's set up correctly.`,
                        role: "ai",
                        ai_model: model.id,
                        parent_message_id: userMessageId,
                        prompt_group_id: promptGroupId,
                        thought_process: thoughtProcess
                    });
                    currentHistory.push(errorMessage);
                    updateHistoryCallback(currentHistory);
                    break;
                }
            } else {
                const aiMessage = await Message.create({
                  conversation_id: activeConversation.id,
                  content: content,
                  role: "ai",
                  ai_model: model.id,
                  parent_message_id: userMessageId,
                  prompt_group_id: promptGroupId,
                  response_time: responseTime,
                  thought_process: thoughtProcess
                });

                currentHistory.push(aiMessage);
                updateHistoryCallback(currentHistory);
                break;
            }
        } catch (error) {
            console.error(`Error from ${model.name}:`, error);
            const errorMessage = await Message.create({
                conversation_id: activeConversation.id,
                content: `I'm having trouble responding right now (${error.message || 'unknown error'}). Please try again.`,
                role: "ai",
                ai_model: model.id,
                prompt_group_id: promptGroupId
            });
            currentHistory.push(errorMessage);
            updateHistoryCallback(currentHistory);
            break;
        }
    }
  }

  const processCollaborationFeatures = async (content, modelId, conversationId) => {
    // Knowledge Gap Detection
    const knowledgeGapMatch = content.match(/\[KNOWLEDGE_GAP:\s*(.*?)\]/);
    if (knowledgeGapMatch) {
      const query = knowledgeGapMatch[1].trim();
      try {
        const research = await InvokeLLM({
          prompt: `Research and provide detailed information about: ${query}`,
          add_context_from_internet: true
        });
        
        await AIMemory.create({
          ai_model: modelId,
          memory_type: "factual",
          key: `research_${Date.now()}`,
          content: research,
          context: `Auto-researched based on knowledge gap: ${query}`,
          importance_score: 7
        });
        // Optionally, remove the KNOWLEDGE_GAP tag from the content after processing
        content = content.replace(knowledgeGapMatch[0], `(Research initiated for "${query}")`);
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
        content = content.replace(imageGenMatch[0], `\n\n![Generated Image](${url})\n*Generated: ${description}*\n`);
      } catch (error) {
        console.error("Failed to generate image:", error);
        content = content.replace(imageGenMatch[0], `[Image generation failed: ${description}]`);
      }
    }

    // You could add similar logic for DISAGREE, VOTE_NEEDED, SUGGEST_ROLES here if they involve UI updates or backend calls.
    // For now, we'll just remove them from the displayed content if found.
    content = content.replace(/\[DISAGREE:\s*(.*?)\]/g, '(Disagreed: $1)');
    content = content.replace(/\[VOTE_NEEDED:\s*(.*?)\]/g, '(Vote requested on: $1)');
    content = content.replace(/\[SUGGEST_ROLES:\s*(.*?)\]/g, '(Role suggestion: $1)');

    return content;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCodeCanvasUpdate = (updatedCanvas) => {
    setActiveCodeCanvas(updatedCanvas);
  };

  const handleCodeCanvasClick = () => {
    if (activeCodeCanvas) {
      setShowCodeCanvas(true);
    } else {
      setActiveCodeCanvas({
        id: 'temp-' + Date.now(),
        conversation_id: activeConversation?.id,
        title: 'New Collaborative Project',
        description: 'Built together with AI assistance',
        language: 'javascript',
        code_content: '// Welcome to the collaborative code canvas!\n// Your AI team will help you build amazing projects here.\n\nfunction collaborativeHello() {\n  console.log("Hello from the AI collaboration team!");\n  console.log("Let\'s build something amazing together!");\n}\n\ncollaborativeHello();',
        version: 1,
        is_active: true
      });
      setShowCodeCanvas(true);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950">
      <ConversationSidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
        onNewConversation={createNewConversation}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader
          activeConversation={activeConversation}
          models={AI_MODELS}
          activeModels={activeModels}
          onToggleModel={setActiveModels}
          isLoading={isLoading}
          currentlyResponding={currentlyResponding}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <MessageList
              messages={messages}
              models={AI_MODELS}
              isLoading={isLoading}
              currentlyResponding={currentlyResponding}
            />
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 p-6 bg-black/20 backdrop-blur-xl">
            {!isProUser && <UpgradeBanner />}
            <div className="flex gap-4 mt-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFileUpload(true)}
                className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
                disabled={!isProUser}
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFileRepository(true)}
                className="text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0"
                disabled={!isProUser}
              >
                <Files className="w-5 h-5" />
              </Button>

              <CodeCanvasButton
                onClick={handleCodeCanvasClick}
                hasActiveCanvas={!!activeCodeCanvas}
                disabled={!isProUser}
              />

              <div className="flex-1 relative">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={activeModels.length > 0 ? `Start a collaborative discussion...` : `Select AI models to begin...`}
                  className="min-h-[60px] bg-white/5 border-white/10 text-white placeholder:text-gray-400 resize-none pr-12"
                  disabled={isLoading || activeModels.length === 0 || !isProUser}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading || activeModels.length === 0 || !isProUser}
                  size="icon"
                  className="absolute right-2 bottom-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  {isLoading ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {attachedFiles.length > 0 && (
              <div className="mt-4 p-3 rounded-lg glass-effect border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Attached files ({attachedFiles.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-white truncate">{file.name}</span>
                      {file.extractedContent && (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
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
                  <span>{activeModels.length} AI collaborators active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-3 h-3" />
                  <span>Memory-enhanced responses</span>
                </div>
                {activeCodeCanvas && (
                  <div className="flex items-center gap-2">
                    <Code className="w-3 h-3" />
                    <span>Code canvas: {activeCodeCanvas.title}</span>
                  </div>
                )}
              </div>
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>

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

      <TeamFormationModal
        isOpen={showTeamFormation}
        onClose={() => setShowTeamFormation(false)}
        onConfirm={startConversation}
        initialPrompt={initialPrompt}
        models={AI_MODELS.filter(m => activeModels.includes(m.id))}
      />
    </div>
  );
}
