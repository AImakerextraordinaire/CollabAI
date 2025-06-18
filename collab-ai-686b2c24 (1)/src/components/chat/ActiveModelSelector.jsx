
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ActiveModelSelector({ models, activeModels, onToggleModel }) {
  
  const handleSelect = (modelId) => {
    const newActiveModels = activeModels.includes(modelId)
      ? activeModels.filter(id => id !== modelId)
      : [...activeModels, modelId];
    onToggleModel(newActiveModels);
  };
  
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-full glass-effect border border-white/10">
      <span className="text-sm text-gray-400 pl-2">Active Models:</span>
      <TooltipProvider>
        {models.map(model => (
          <Tooltip key={model.id}>
            <TooltipTrigger asChild>
              <motion.div
                onClick={() => handleSelect(model.id)}
                className={`relative w-10 h-10 rounded-full cursor-pointer flex items-center justify-center font-bold text-white text-lg
                  bg-gradient-to-br ${model.color} transition-all duration-300 transform hover:scale-110`}
                whileTap={{ scale: 0.9 }}
              >
                {model.icon}
                <AnimatePresence>
                  {activeModels.includes(model.id) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white border-slate-700">
              <p>{model.name} ({activeModels.includes(model.id) ? 'Active' : 'Inactive'})</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
