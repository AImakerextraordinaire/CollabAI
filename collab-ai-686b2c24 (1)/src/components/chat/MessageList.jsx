
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bot, Clock, Loader2, Zap, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FileAttachment from "./FileAttachment";
import MemoryIndicator from './MemoryIndicator';
import ToolCallDisplay from './ToolCallDisplay';

export default function MessageList({ messages, models, isLoading, currentlyResponding }) {
  const getModelInfo = (modelId) => {
    return models.find(m => m.id === modelId) || { name: modelId, color: "from-gray-400 to-gray-500", icon: "?" };
  };

  // State to manage visibility of thought processes
  const [showThoughts, setShowThoughts] = useState({});

  const toggleThoughts = (messageId) => {
    setShowThoughts(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Render message content with collaboration features highlighted
  const renderMessageContent = (content) => {
    if (!content) return content;
    
    // Highlight collaboration features
    let processedContent = content;
    
    // Highlight disagreements
    processedContent = processedContent.replace(
      /\[DISAGREE:\s*(.*?)\]/g, 
      '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30 mr-2">⚠️ Disagree: $1</span>'
    );
    
    // Highlight vote requests
    processedContent = processedContent.replace(
      /\[VOTE_NEEDED:\s*(.*?)\]/g, 
      '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 mr-2">🗳️ Vote Needed: $1</span>'
    );
    
    // Highlight role suggestions
    processedContent = processedContent.replace(
      /\[SUGGEST_ROLES:\s*(.*?)\]/g, 
      '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 mr-2">👥 Role Suggestion: $1</span>'
    );
    
    // Remove processed knowledge gap tags (since they're handled server-side)
    processedContent = processedContent.replace(/\[KNOWLEDGE_GAP:\s*(.*?)\]/g, '');
    
    // Convert markdown images to actual img tags
    processedContent = processedContent.replace(
      /!\[Generated Image\]\((.*?)\)\n\*Generated: (.*?)\*/g,
      '<div class="my-4 p-3 bg-white/5 rounded-lg border border-white/10"><img src="$1" alt="$2" class="max-w-full h-auto rounded-lg mb-2" /><p class="text-xs text-gray-400 italic">🎨 AI Generated: $2</p></div>'
    );
    
    return processedContent;
  };

  // Group messages by prompt groups to show collaborative threads
  const groupedMessages = [];
  let currentGroup = [];
  
  messages.forEach((message, index) => {
    if (message.role === "human") {
      if (currentGroup.length > 0) {
        groupedMessages.push(currentGroup);
      }
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
    
    // If this is the last message, add the current group
    if (index === messages.length - 1 && currentGroup.length > 0) {
      groupedMessages.push(currentGroup);
    }
  });

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {groupedMessages.map((group, groupIndex) => (
          <motion.div
            key={`group-${groupIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Human message */}
            <div className="flex gap-4 justify-end">
              <div className="max-w-[70%]">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  <div className="whitespace-pre-wrap">{group[0].content}</div>
                  {group[0].attachedFiles && (
                    <FileAttachment files={group[0].attachedFiles} />
                  )}
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* AI responses in sequence */}
            <div className="space-y-3 ml-8">
              {group.slice(1).map((message, msgIndex) => {
                const modelInfo = getModelInfo(message.ai_model);
                
                if (message.role === 'tool') {
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: msgIndex * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 max-w-[80%]">
                        <ToolCallDisplay toolResult={message.content} />
                      </div>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: msgIndex * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${modelInfo.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{modelInfo.icon}</span>
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="glass-effect p-4 rounded-2xl border border-white/10 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={`bg-gradient-to-r ${modelInfo.color} text-white border-0 text-xs`}
                          >
                            {modelInfo.name}
                          </Badge>
                          <MemoryIndicator aiModel={message.ai_model} />
                          {message.response_time && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {message.response_time}ms
                            </div>
                          )}
                        </div>
                        <div 
                          className="whitespace-pre-wrap leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderMessageContent(message.content) }}
                        />
                        {message.tool_calls && <ToolCallDisplay toolCalls={message.tool_calls} />}
                        
                        {/* Thought Process Display */}
                        {message.thought_process && (
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                              onClick={() => toggleThoughts(message.id)}
                            >
                              <Brain className="w-3 h-3" />
                              {showThoughts[message.id] ? "Hide Thoughts" : "Show Thoughts"}
                            </Button>
                            <AnimatePresence>
                              {showThoughts[message.id] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-2 p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 whitespace-pre-wrap"
                                >
                                  {message.thought_process}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Show loading indicator for the currently responding AI */}
      {isLoading && currentlyResponding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="space-y-3 ml-8">
            <div className="flex gap-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${getModelInfo(currentlyResponding).color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm">{getModelInfo(currentlyResponding).icon}</span>
              </div>
              <div className="flex-1 max-w-[80%]">
                <div className="glass-effect p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`bg-gradient-to-r ${getModelInfo(currentlyResponding).color} text-white border-0 text-xs`}
                    >
                      {getModelInfo(currentlyResponding).name}
                    </Badge>
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
