import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ToolCallDisplay({ toolCalls, toolResult }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!toolCalls && !toolResult) return null;

  let parsedCalls, parsedResult;
  try {
    if (toolCalls) parsedCalls = JSON.parse(toolCalls);
  } catch {
    parsedCalls = { error: "Failed to parse tool calls" };
  }
  try {
    if (toolResult) parsedResult = JSON.parse(toolResult);
  } catch {
    parsedResult = { error: "Failed to parse tool result" };
  }

  const renderContent = () => {
    if (parsedCalls) {
      return (
        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Tool Call</h4>
          <pre className="text-xs text-gray-300 bg-black/30 p-2 rounded-md">
            <code>{JSON.stringify(parsedCalls, null, 2)}</code>
          </pre>
        </div>
      );
    }
    if (parsedResult) {
      const isSuccess = parsedResult.success;
      return (
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
            Tool Result ({parsedResult.tool_name})
          </h4>
          <ScrollArea className="max-h-48">
            <pre className="text-xs text-gray-300 bg-black/30 p-2 rounded-md">
              <code>{JSON.stringify(parsedResult.data, null, 2)}</code>
            </pre>
          </ScrollArea>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 glass-effect border border-purple-500/30 rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-2 bg-purple-500/10 flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-purple-300">
            {parsedCalls ? 'Executing Tool...' : 'Tool Executed'}
          </span>
          {parsedCalls && <Badge variant="outline" className="text-xs border-purple-400/30 text-purple-300">{parsedCalls.name}</Badge>}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
      </button>
      {isExpanded && (
        <div className="p-3 space-y-3">
          {renderContent()}
        </div>
      )}
    </motion.div>
  );
}