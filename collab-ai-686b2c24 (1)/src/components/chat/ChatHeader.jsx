import React from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";
import ActiveModelSelector from "./ActiveModelSelector";

export default function ChatHeader({
  activeConversation,
  models,
  activeModels,
  onToggleModel,
  isLoading,
  currentlyResponding
}) {
  const getModelInfo = (modelId) => models.find(m => m.id === modelId);

  return (
    <div className="border-b border-white/10 p-6 bg-black/20 backdrop-blur-xl z-10">
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
              Collaborative Mode
            </Badge>
            
            {isLoading && currentlyResponding && (
              <Badge 
                variant="outline" 
                className="border-blue-400/30 bg-blue-500/10 text-blue-300 flex items-center gap-1 animate-pulse"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                {getModelInfo(currentlyResponding)?.name} is thinking...
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ActiveModelSelector 
            models={models}
            activeModels={activeModels}
            onToggleModel={onToggleModel}
          />
        </div>
      </div>
    </div>
  );
}