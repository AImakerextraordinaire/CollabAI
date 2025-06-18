import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

/**
 * A static visual indicator that the AI is using its memory.
 * This component no longer fetches data to prevent API rate limit issues.
 * It serves as a visual cue in the UI.
 */
export default function MemoryIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1"
      title="Memory-enhanced response"
    >
      <div className="relative">
        <Brain className="w-3 h-3 text-blue-400" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      </div>
    </motion.div>
  );
}