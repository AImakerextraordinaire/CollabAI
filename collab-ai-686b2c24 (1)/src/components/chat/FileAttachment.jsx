import React from 'react';
import { motion } from 'framer-motion';
import { File, Image, Code, FileSpreadsheet, FileText, ExternalLink, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const FILE_TYPE_ICONS = {
  'application/pdf': FileText,
  'text/plain': FileText,
  'text/markdown': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'text/csv': FileSpreadsheet,
  'application/json': Code,
  'text/javascript': Code,
  'text/html': Code,
  'text/css': Code,
  'application/python': Code,
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'image/webp': Image,
};

const FILE_TYPE_COLORS = {
  'application/pdf': 'from-red-400 to-red-500',
  'text/plain': 'from-gray-400 to-gray-500',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'from-blue-400 to-blue-500',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'from-green-400 to-green-500',
  'text/csv': 'from-green-400 to-green-500',
  'application/json': 'from-yellow-400 to-yellow-500',
  'text/javascript': 'from-yellow-400 to-orange-500',
  'image/jpeg': 'from-purple-400 to-purple-500',
  'image/png': 'from-purple-400 to-purple-500',
};

export default function FileAttachment({ files }) {
  const getFileIcon = (type) => {
    const IconComponent = FILE_TYPE_ICONS[type] || File;
    return IconComponent;
  };

  const getFileColor = (type) => {
    return FILE_TYPE_COLORS[type] || 'from-gray-400 to-gray-500';
  };

  if (!files || files.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {files.map((file, index) => {
        const IconComponent = getFileIcon(file.type);
        const colorClass = getFileColor(file.type);
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-3 rounded-lg glass-effect border border-white/10"
          >
            <div className={`w-8 h-8 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <IconComponent className="w-4 h-4 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{file.name}</p>
              <p className="text-xs text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {file.extractedContent && (
                <Badge variant="outline" className="border-green-400/30 bg-green-500/10 text-green-400 text-xs">
                  Analyzed
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-400 hover:text-white"
                onClick={() => window.open(file.url, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}