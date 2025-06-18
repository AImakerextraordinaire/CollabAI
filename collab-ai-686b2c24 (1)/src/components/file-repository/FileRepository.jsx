
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  FolderOpen,
  File,
  Plus,
  Search,
  Upload,
  Download,
  Archive,
  Code,
  FileText,
  Image,
  Database,
  Settings,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  X,
  Trash2
} from 'lucide-react';
import { FileRepository as FileRepositoryEntity } from "@/api/entities";
import { RepositoryFile } from "@/api/entities";
import FileUploadZone from '../chat/FileUploadZone';

const FILE_ICONS = {
  'application/javascript': Code,
  'text/javascript': Code,
  'application/json': Code,
  'text/html': Code,
  'text/css': Code,
  'application/python': Code,
  'text/plain': FileText,
  'application/pdf': FileText,
  'text/markdown': FileText,
  'image/jpeg': Image,
  'image/png': Image,
  'image/gif': Image,
  'image/webp': Image,
  'application/zip': Archive,
  'text/csv': Database,
};

const CATEGORY_COLORS = {
  source: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  documentation: 'bg-green-500/20 text-green-400 border-green-500/30',
  asset: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  config: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  test: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  data: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

export default function FileRepository({ conversationId, isVisible, onClose }) {
  const [repository, setRepository] = useState(null);
  const [files, setFiles] = useState([]);
  const [folderStructure, setFolderStructure] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']));
  const [selectedFolder, setSelectedFolder] = useState('/');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (conversationId && isVisible) {
      loadRepository();
    }
  }, [conversationId, isVisible]);

  const loadRepository = async () => {
    try {
      const repos = await FileRepositoryEntity.filter({ conversation_id: conversationId });
      if (repos.length > 0) {
        const repo = repos[0];
        setRepository(repo);
        setFolderStructure(JSON.parse(repo.folder_structure || '{}'));
        loadFiles(repo.id);
      } else {
        createRepository();
      }
    } catch (error) {
      console.error('Failed to load repository:', error);
      createRepository();
    }
  };

  const createRepository = async () => {
    try {
      const defaultStructure = {
        '/': {
          type: 'folder',
          name: 'root',
          children: {
            'src': { type: 'folder', name: 'src', children: {} },
            'docs': { type: 'folder', name: 'docs', children: {} },
            'assets': { type: 'folder', name: 'assets', children: {} },
            'config': { type: 'folder', name: 'config', children: {} }
          }
        }
      };

      const repo = await FileRepositoryEntity.create({
        conversation_id: conversationId,
        name: 'Project Repository',
        description: 'Organized file storage for collaborative development',
        folder_structure: JSON.stringify(defaultStructure),
        total_files: 0,
        total_size: 0,
        last_activity: new Date().toISOString()
      });

      setRepository(repo);
      setFolderStructure(defaultStructure);
      setExpandedFolders(new Set(['/', '/src', '/docs', '/assets', '/config']));
    } catch (error) {
      console.error('Failed to create repository:', error);
    }
  };

  const loadFiles = async (repositoryId) => {
    try {
      const repoFiles = await RepositoryFile.filter({ repository_id: repositoryId }, '-created_date');
      setFiles(repoFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !repository) return;

    const newPath = selectedFolder === '/' ? `/${newFolderName}` : `${selectedFolder}/${newFolderName}`;

    const updatedStructure = { ...folderStructure };
    const pathParts = newPath.split('/').filter(Boolean);
    let current = updatedStructure['/'];

    // Traverse the structure to the parent of the new folder
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current || !current.children || !current.children[pathParts[i]]) {
        // Path does not exist, break
        console.error("Parent folder not found in structure.");
        return;
      }
      current = current.children[pathParts[i]];
    }

    // Check if folder already exists
    if (current.children && current.children[newFolderName]) {
      alert(`Folder "${newFolderName}" already exists in "${selectedFolder}".`);
      return;
    }

    // Add the new folder
    if (!current.children) {
      current.children = {};
    }
    current.children[newFolderName] = {
      type: 'folder',
      name: newFolderName,
      children: {}
    };

    try {
      await FileRepositoryEntity.update(repository.id, {
        folder_structure: JSON.stringify(updatedStructure),
        last_activity: new Date().toISOString()
      });

      setFolderStructure(updatedStructure);
      setExpandedFolders(prev => new Set([...prev, newPath]));
      setNewFolderName('');
      setShowNewFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder. Please try again.');
    }
  };

  const handleFilesUploaded = async (uploadedFiles) => {
    if (!repository) return;

    for (const file of uploadedFiles) {
      const category = determineFileCategory(file.name, file.type);

      try {
        await RepositoryFile.create({
          repository_id: repository.id,
          conversation_id: conversationId,
          folder_path: selectedFolder,
          file_name: file.name,
          file_url: file.url,
          file_type: file.type,
          file_size: file.size,
          file_category: category,
          extracted_content: file.extractedContent ? JSON.stringify(file.extractedContent) : null,
          analysis_summary: file.extractedContent?.summary || null,
          version: 1,
          last_modified_by: 'User'
        });
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }

    // Update repository stats
    const newTotalFiles = repository.total_files + uploadedFiles.length;
    const newTotalSize = repository.total_size + uploadedFiles.reduce((sum, f) => sum + f.size, 0);

    await FileRepositoryEntity.update(repository.id, {
      total_files: newTotalFiles,
      total_size: newTotalSize,
      last_activity: new Date().toISOString()
    });

    loadFiles(repository.id);
    setShowUpload(false);
  };

  const deleteFolder = async (folderPath) => {
    if (!repository) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete the folder "${folderPath}" and all its contents?`);
    if (!confirmDelete) return;

    try {
      // First, delete all files in this folder and its subfolders
      const filesToDelete = files.filter(file => 
        file.folder_path === folderPath || file.folder_path.startsWith(folderPath + '/')
      );
      
      for (const file of filesToDelete) {
        await RepositoryFile.delete(file.id);
      }

      // Update folder structure by removing the folder
      const updatedStructure = { ...folderStructure };
      const pathParts = folderPath.split('/').filter(Boolean);
      
      if (pathParts.length === 0) { // Should not happen for a specific folderPath, but as a safeguard
        console.warn("Attempted to delete root folder which is not allowed.");
        return;
      } else if (pathParts.length === 1) {
        // Top-level folder directly under root (e.g., '/src')
        if (updatedStructure['/'] && updatedStructure['/'].children) {
          delete updatedStructure['/'].children[pathParts[0]];
        }
      } else {
        // Nested folder - traverse to parent and delete
        let current = updatedStructure['/'];
        let parentPath = '';
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current || !current.children || !current.children[pathParts[i]]) {
            console.error("Parent folder not found during deletion traversal.");
            return; // Exit if path is invalid
          }
          current = current.children[pathParts[i]];
          parentPath = (parentPath === '/' ? '/' : `${parentPath}/`) + pathParts[i];
        }
        if (current && current.children) {
          delete current.children[pathParts[pathParts.length - 1]];
        }
      }

      // Update repository
      await FileRepositoryEntity.update(repository.id, {
        folder_structure: JSON.stringify(updatedStructure),
        total_files: repository.total_files - filesToDelete.length,
        total_size: repository.total_size - filesToDelete.reduce((sum, f) => sum + f.file_size, 0),
        last_activity: new Date().toISOString()
      });

      setFolderStructure(updatedStructure);
      loadFiles(repository.id);
      
      // If we deleted the currently selected folder, go back to root
      if (selectedFolder === folderPath || selectedFolder.startsWith(folderPath + '/')) {
        setSelectedFolder('/');
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
      alert('Failed to delete folder. Please try again.');
    }
  };

  const deleteFile = async (file) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${file.file_name}"?`);
    if (!confirmDelete) return;

    try {
      await RepositoryFile.delete(file.id);
      
      // Update repository stats
      await FileRepositoryEntity.update(repository.id, {
        total_files: repository.total_files - 1,
        total_size: repository.total_size - file.file_size,
        last_activity: new Date().toISOString()
      });

      loadFiles(repository.id);
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const determineFileCategory = (fileName, fileType) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext)) {
      return 'source';
    }
    if (['md', 'txt', 'pdf', 'doc', 'docx'].includes(ext)) {
      return 'documentation';
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'].includes(ext)) {
      return 'asset';
    }
    if (['json', 'yaml', 'yml', 'config', 'env'].includes(ext)) {
      return 'config';
    }
    if (['test.js', 'spec.js'].some(pattern => fileName.includes(pattern))) {
      return 'test';
    }
    if (['csv', 'xlsx', 'sql', 'db'].includes(ext)) {
      return 'data';
    }
    return 'other';
  };

  const exportFolderAsZip = async (folderPath = '/') => {
    if (!repository) return;

    try {
      // Get all files in the selected folder and subfolders
      const allFiles = files.filter(file =>
        file.folder_path.startsWith(folderPath)
      );

      if (allFiles.length === 0) {
        alert('No files found in this folder to export.');
        return;
      }

      // Create a simple zip-like structure by downloading files
      const folderName = folderPath === '/' ? repository.name : folderPath.split('/').pop();

      // For now, we'll create a manifest file that lists all the files and their URLs
      // In a full implementation, you'd use a proper ZIP library
      const manifest = {
        repository: repository.name,
        folder: folderPath,
        exported_at: new Date().toISOString(),
        files: allFiles.map(file => ({
          path: `${file.folder_path}/${file.file_name}`,
          name: file.file_name,
          url: file.file_url,
          size: file.file_size,
          type: file.file_type,
          category: file.file_category
        }))
      };

      // Create and download the manifest
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json'
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      const a = document.createElement('a');
      a.href = manifestUrl;
      a.download = `${folderName}_export_manifest.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(manifestUrl);

      // Also trigger downloads for individual files
      // Limiting to 10 files to avoid browser blocking multiple pop-ups
      const filesToDownload = allFiles.slice(0, 10);
      for (const file of filesToDownload) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = file.file_url;
          link.download = file.file_name;
          link.target = '_blank'; // Open in new tab to prevent navigation if browser handles file
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, filesToDownload.indexOf(file) * 500); // Stagger downloads
      }

      if (allFiles.length > 10) {
        alert(`Started downloading the manifest file and the first 10 files. Check the manifest file for the complete list of ${allFiles.length} files with their URLs.`);
      } else {
        alert(`Started downloading the manifest file and ${allFiles.length} files.`);
      }

    } catch (error) {
      console.error('Failed to export folder:', error);
      alert('Failed to export folder. Please try again.');
    }
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderTree = (structure, currentPath = '/') => {
    if (!structure || !structure.children) return null;

    return Object.entries(structure.children).map(([name, item]) => {
      const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      const isExpanded = expandedFolders.has(fullPath);
      const isSelected = selectedFolder === fullPath;

      return (
        <div key={fullPath}>
          <motion.div
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group ${
              isSelected ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5'
            }`}
            onClick={() => {
              setSelectedFolder(fullPath);
              if (item.type === 'folder') {
                toggleFolder(fullPath);
              }
            }}
          >
            {item.type === 'folder' && (
              <Button
                variant="ghost"
                size="icon"
                className="w-4 h-4 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(fullPath);
                }}
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Button>
            )}
            {item.type === 'folder' ? (
              isExpanded ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />
            ) : (
              <File className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-white flex-1">{name}</span>

            {/* Action buttons for folders */}
            {item.type === 'folder' && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportFolderAsZip(fullPath);
                  }}
                  title="Export folder as ZIP"
                >
                  <Download className="w-3 h-3 text-gray-400 hover:text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(fullPath);
                  }}
                  title="Delete folder"
                >
                  <Trash2 className="w-3 h-3 text-red-400 hover:text-red-300" />
                </Button>
              </div>
            )}
          </motion.div>

          {item.type === 'folder' && isExpanded && (
            <div className="ml-4 border-l border-white/10 pl-2">
              {renderFolderTree(item, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm ||
      file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFolder = file.folder_path === selectedFolder;

    return matchesSearch && matchesFolder;
  });

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl z-50 flex"
      >
        {/* Sidebar - Folder Tree */}
        <div className="w-80 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">File Repository</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolder(true)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(true)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>

            {/* Export entire repository button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportFolderAsZip('/')}
              className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <Archive className="w-4 h-4 mr-2" />
              Export All Files
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            {folderStructure['/'] && renderFolderTree(folderStructure['/'])}
          </ScrollArea>

          {repository && (
            <div className="p-4 border-t border-white/10 text-xs text-gray-400">
              <div className="flex justify-between mb-2">
                <span>{repository.total_files} files</span>
                <span>{(repository.total_size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportFolderAsZip(selectedFolder)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Export "{selectedFolder === '/' ? 'Root' : selectedFolder.split('/').pop()}"
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Files */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">{selectedFolder}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportFolderAsZip(selectedFolder)}
                  className="ml-2 text-xs text-gray-400 hover:text-white"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white w-64"
                  />
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredFiles.map((file) => {
                  const IconComponent = FILE_ICONS[file.file_type] || File;

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-effect border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{file.file_name}</h4>
                          <p className="text-xs text-gray-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-effect border border-white/10 rounded-md">
                            <DropdownMenuItem onClick={() => window.open(file.file_url, '_blank')}>
                              <Download className="w-4 h-4 mr-2" />
                              Open/Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteFile(file)}
                              className="text-red-400 focus:text-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        <Badge className={`text-xs ${CATEGORY_COLORS[file.file_category]}`}>
                          {file.file_category}
                        </Badge>
                        {file.version > 1 && (
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            v{file.version}
                          </Badge>
                        )}
                      </div>

                      {file.analysis_summary && (
                        <p className="text-xs text-gray-400 line-clamp-2">{file.analysis_summary}</p>
                      )}

                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-gray-500">{file.last_modified_by}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                          onClick={() => window.open(file.file_url, '_blank')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Open
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No files in this folder</p>
                <Button
                  variant="outline"
                  className="mt-4 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setShowUpload(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </motion.div>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"
            onClick={() => setShowNewFolder(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-effect border border-white/10 rounded-xl p-6 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="mb-4 bg-white/5 border-white/10 text-white"
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                  Cancel
                </Button>
                <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                  Create
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Upload */}
      <FileUploadZone
        isVisible={showUpload}
        onClose={() => setShowUpload(false)}
        onFilesUploaded={handleFilesUploaded}
      />
    </>
  );
}
