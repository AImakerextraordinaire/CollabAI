import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectBuildRepository } from "@/api/entities";
import { ProjectBuildFile } from "@/api/entities";
import { exportProjectAsZip } from '@/api/functions';
import {
  Folder,
  File,
  X,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Download,
  Loader2,
  FileCode
} from 'lucide-react';

const buildTree = (files) => {
  const tree = {};

  files.forEach(file => {
    const pathParts = file.folder_path.split('/').filter(Boolean);
    let currentLevel = tree;

    pathParts.forEach(part => {
      if (!currentLevel[part]) {
        currentLevel[part] = { type: 'folder', children: {} };
      }
      currentLevel = currentLevel[part].children;
    });

    if (!currentLevel[file.file_name]) {
      currentLevel[file.file_name] = { type: 'file', data: file };
    }
  });

  return tree;
};

const FolderTreeView = ({ node, onFileSelect, path = '' }) => {
  return (
    <div className="pl-4">
      {Object.entries(node).map(([name, item]) => (
        <div key={name}>
          {item.type === 'folder' ? (
            <FolderNode name={name} item={item} onFileSelect={onFileSelect} path={`${path}/${name}`} />
          ) : (
            <FileNode name={name} item={item} onFileSelect={onFileSelect} />
          )}
        </div>
      ))}
    </div>
  );
};

const FolderNode = ({ name, item, onFileSelect, path }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <div 
        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Folder className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-white">{name}</span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <FolderTreeView node={item.children} onFileSelect={onFileSelect} path={path} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FileNode = ({ name, item, onFileSelect }) => {
  return (
    <div 
      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/10"
      onClick={() => onFileSelect(item.data)}
    >
      <FileCode className="w-4 h-4 text-gray-400 ml-4" />
      <span className="text-sm text-white">{name}</span>
    </div>
  );
};

export default function ProjectBuildViewer({ conversationId, isVisible, onClose }) {
  const [repository, setRepository] = useState(null);
  const [files, setFiles] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isVisible && conversationId) {
      loadProjectData();
    } else {
      // Reset state when not visible
      setRepository(null);
      setFiles([]);
      setFileTree({});
      setSelectedFile(null);
      setIsLoading(true);
    }
  }, [isVisible, conversationId]);

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      // Add defensive checks
      if (!ProjectBuildRepository || typeof ProjectBuildRepository.filter !== 'function') {
        console.error('ProjectBuildRepository not properly loaded');
        setIsLoading(false);
        return;
      }

      const repos = await ProjectBuildRepository.filter({ conversation_id: conversationId });
      if (repos.length > 0) {
        const repo = repos[0];
        setRepository(repo);
        
        if (!ProjectBuildFile || typeof ProjectBuildFile.filter !== 'function') {
          console.error('ProjectBuildFile not properly loaded');
          setIsLoading(false);
          return;
        }

        const projectFiles = await ProjectBuildFile.filter({ repository_id: repo.id });
        setFiles(projectFiles);
        setFileTree(buildTree(projectFiles));
        if (projectFiles.length > 0) {
          setSelectedFile(projectFiles[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load project repository:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!conversationId) return;
    setIsDownloading(true);
    try {
      const { data, headers } = await exportProjectAsZip({ conversationId });
      
      const blob = new Blob([data], { type: headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      
      const contentDisposition = headers['content-disposition'];
      let filename = 'project.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length === 2)
          filename = filenameMatch[1];
      }

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to download project:", error);
      alert("Failed to download project. The repository might be empty.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">{repository?.name || 'AI Project Build'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownload} 
            disabled={isDownloading || !repository}
            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isDownloading ? 'Zipping...' : 'Download Project ZIP'}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : !repository ? (
          <div className="w-full flex flex-col items-center justify-center text-center">
            <Briefcase className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-xl text-white font-semibold">No Project Started</h3>
            <p className="text-gray-400">The AIs haven't created a project repository yet.</p>
          </div>
        ) : (
          <>
            {/* File Tree */}
            <div className="w-80 border-r border-white/10 overflow-y-auto p-4">
              <FolderTreeView node={fileTree} onFileSelect={setSelectedFile} />
            </div>

            {/* File Content Viewer */}
            <div className="flex-1 flex flex-col">
              {selectedFile ? (
                <>
                  <div className="p-4 border-b border-white/10 flex-shrink-0">
                    <h4 className="font-medium text-white text-sm truncate">{selectedFile.file_name}</h4>
                    <p className="text-xs text-gray-400">{selectedFile.folder_path}</p>
                  </div>
                  <ScrollArea className="flex-1 bg-slate-900/50">
                    <pre className="p-4 text-sm text-gray-200 whitespace-pre-wrap font-mono">
                      <code>{selectedFile.file_content}</code>
                    </pre>
                  </ScrollArea>
                </>
              ) : (
                <div className="w-full flex flex-col items-center justify-center text-center">
                    <File className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-xl text-white font-semibold">Select a file</h3>
                    <p className="text-gray-400">Choose a file from the list to view its content.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}