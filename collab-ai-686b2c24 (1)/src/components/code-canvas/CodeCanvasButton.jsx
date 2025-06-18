import React from 'react';
import { Button } from "@/components/ui/button";
import { Code, Plus } from 'lucide-react';

export default function CodeCanvasButton({ onClick, hasActiveCanvas = false }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0 ${
        hasActiveCanvas ? 'text-purple-400 bg-purple-500/10' : ''
      }`}
      title={hasActiveCanvas ? 'Open Code Canvas' : 'Create Code Canvas'}
    >
      {hasActiveCanvas ? (
        <Code className="w-5 h-5" />
      ) : (
        <div className="relative">
          <Code className="w-5 h-5" />
          <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-purple-500 rounded-full text-white" />
        </div>
      )}
    </Button>
  );
}