import React from 'react';
import { Button } from "@/components/ui/button";
import { FolderOpen, Files } from 'lucide-react';

export default function FileRepositoryButton({ onClick, hasFiles = false }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`text-gray-400 hover:text-white hover:bg-white/10 flex-shrink-0 ${
        hasFiles ? 'text-blue-400 bg-blue-500/10' : ''
      }`}
      title="File Repository"
    >
      {hasFiles ? (
        <FolderOpen className="w-5 h-5" />
      ) : (
        <Files className="w-5 h-5" />
      )}
    </Button>
  );
}