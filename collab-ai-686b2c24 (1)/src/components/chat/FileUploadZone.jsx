
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, Image, Code, FileSpreadsheet, FileText, X, CheckCircle, AlertCircle, Folder, FolderOpen, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';

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
  // Added LibreOffice Icons
  'application/vnd.oasis.opendocument.text': FileText,
  'application/vnd.oasis.opendocument.spreadsheet': FileSpreadsheet,
  'application/vnd.oasis.opendocument.presentation': Presentation,
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
  // Added LibreOffice Colors
  'application/vnd.oasis.opendocument.text': 'from-blue-500 to-cyan-500',
  'application/vnd.oasis.opendocument.spreadsheet': 'from-emerald-500 to-green-500',
  'application/vnd.oasis.opendocument.presentation': 'from-orange-500 to-red-500',
};

export default function FileUploadZone({ onFilesUploaded, isVisible, onClose }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const getAllFilesFromItems = async (items) => {
    const files = [];
    
    const traverseFileTree = (item, path = '') => {
      return new Promise((resolve) => {
        if (item.isFile) {
          item.file((file) => {
            // Add relative path to file object
            const fileWithPath = new File([file], path + file.name, { type: file.type });
            fileWithPath.webkitRelativePath = path + file.name;
            files.push(fileWithPath);
            resolve();
          });
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          dirReader.readEntries((entries) => {
            const promises = entries.map(entry => 
              traverseFileTree(entry, path + item.name + '/')
            );
            Promise.all(promises).then(() => resolve());
          });
        }
      });
    };

    const promises = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        promises.push(traverseFileTree(item));
      }
    }

    await Promise.all(promises);
    return files;
  };

  const processFiles = async (fileList, isDrop = false) => {
    let filesToProcess = [];
    
    if (isDrop) {
      // Handle drag and drop with folder support
      filesToProcess = await getAllFilesFromItems(fileList);
    } else {
      // Handle regular file input
      filesToProcess = Array.from(fileList);
    }

    const processedFiles = filesToProcess.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      path: file.webkitRelativePath || file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'pending',
      progress: 0,
      url: null,
      extractedContent: null
    }));

    setFiles(processedFiles);
    setUploading(true);

    const uploadedFiles = [];

    for (let i = 0; i < processedFiles.length; i++) {
      const fileData = processedFiles[i];
      
      try {
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'uploading', progress: 25 } : f
        ));

        // Upload file
        const { file_url } = await UploadFile({ file: fileData.file });
        
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, progress: 50, url: file_url } : f
        ));

        let extractedContent = null;

        // Try to extract content for text-based files
        if (fileData.type.startsWith('text/') || 
            fileData.type.includes('pdf') || 
            fileData.type.includes('document') || 
            fileData.type.includes('spreadsheet') ||
            fileData.type.includes('presentation') || // Added for LibreOffice Impress
            fileData.type === 'application/json' ||
            fileData.name.endsWith('.md') ||
            fileData.name.endsWith('.py') ||
            fileData.name.endsWith('.js') ||
            fileData.name.endsWith('.jsx') ||
            fileData.name.endsWith('.ts') ||
            fileData.name.endsWith('.tsx') ||
            fileData.name.endsWith('.html') ||
            fileData.name.endsWith('.css') ||
            fileData.name.endsWith('.odt') || // Added for LibreOffice Writer
            fileData.name.endsWith('.ods') || // Added for LibreOffice Calc
            fileData.name.endsWith('.odp')) { // Added for LibreOffice Impress
          
          try {
            setFiles(prev => prev.map(f => 
              f.id === fileData.id ? { ...f, progress: 75 } : f
            ));

            const extractResult = await ExtractDataFromUploadedFile({
              file_url,
              json_schema: {
                type: "object",
                properties: {
                  content: { type: "string", description: "The full text content of the file" },
                  summary: { type: "string", description: "A brief summary of the file content" },
                  file_type: { type: "string", description: "What type of document this appears to be" }
                }
              }
            });

            if (extractResult.status === 'success') {
              extractedContent = extractResult.output;
            }
          } catch (error) {
            console.log("Content extraction failed, but file upload succeeded");
          }
        }

        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'completed', 
            progress: 100,
            extractedContent 
          } : f
        ));

        uploadedFiles.push({
          name: fileData.name,
          path: fileData.path,
          url: file_url,
          type: fileData.type,
          size: fileData.size,
          extractedContent
        });

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'error', progress: 0 } : f
        ));
      }
    }

    setUploading(false);
    
    if (uploadedFiles.length > 0) {
      onFilesUploaded(uploadedFiles);
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const items = Array.from(e.dataTransfer.items);
    if (items.length > 0) {
      await processFiles(items, true);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, false);
      // Clear the input value so the same file can be selected again after removal
      e.target.value = null; 
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (type, name) => {
    // Check file extension for better icon detection
    if (name.endsWith('.py')) return Code;
    if (name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.ts') || name.endsWith('.tsx')) return Code;
    if (name.endsWith('.html') || name.endsWith('.css')) return Code;
    if (name.endsWith('.md')) return FileText;
    
    const IconComponent = FILE_TYPE_ICONS[type] || File;
    return IconComponent;
  };

  const getFileColor = (type, name) => {
    // Check file extension for better color detection
    if (name.endsWith('.py')) return 'from-green-400 to-green-500';
    if (name.endsWith('.js') || name.endsWith('.jsx')) return 'from-yellow-400 to-orange-500';
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'from-blue-400 to-blue-500';
    if (name.endsWith('.html')) return 'from-orange-400 to-red-500';
    if (name.endsWith('.css')) return 'from-blue-400 to-purple-500';
    if (name.endsWith('.md')) return 'from-gray-400 to-gray-500';
    
    return FILE_TYPE_COLORS[type] || 'from-gray-400 to-gray-500';
  };

  // Group files by folder for better display
  const groupFilesByFolder = (files) => {
    const groups = {};
    files.forEach(file => {
      const pathParts = file.path.split('/');
      const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'root';
      
      if (!groups[folder]) {
        groups[folder] = [];
      }
      groups[folder].push(file);
    });
    return groups;
  };

  if (!isVisible) return null;

  const fileGroups = files.length > 0 ? groupFilesByFolder(files) : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        className="glass-effect border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Upload Files & Folders</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </div>

        <div className="p-6">
          {files.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? "border-purple-400 bg-purple-500/10" 
                  : "border-white/20 hover:border-white/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={folderInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                webkitdirectory=""
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="files-upload"
                // MODIFICATION: Expanded accepted file types to include LibreOffice formats
                accept=".pdf,.txt,.md,.docx,.xlsx,.csv,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar,.7z,.mp3,.wav,.ogg,.mp4,.mov,.avi,.mkv,.psd,.ai,.svg,.xml,.yml,.toml,.ini,.conf,.log,.sh,.bat,.cmd,.exe,.dll,.obj,.lib,.bin,.dat,.db,.sqlite,.sql,.bak,.iso,.dmg,.pkg,.odt,.ods,.odp"
              />
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-2">
                Drop files or entire folders here
              </h4>
              
              <p className="text-gray-400 mb-6">
                Support for individual files, complete project folders, and document collections
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <File className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
                <Button onClick={() => folderInputRef.current?.click()} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Folder className="w-4 h-4 mr-2" />
                  Select Folder
                </Button>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {/* Updated example badges for commonly accepted file types */}
                {['Code (JS, PY, HTML)', 'Documents (PDF, DOCX, ODT)', 'Data (CSV, XLSX, ODS)', 'Images (PNG, JPG)', 'Archives (ZIP)', 'Folders'].map(type => (
                  <Badge key={type} variant="outline" className="border-white/20 text-gray-400 text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {Object.entries(fileGroups).map(([folder, folderFiles]) => (
                  <motion.div
                    key={folder}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-3"
                  >
                    {folder !== 'root' && (
                      <div className="flex items-center gap-2 text-sm text-gray-300 border-b border-white/10 pb-2">
                        <Folder className="w-4 h-4" />
                        <span className="font-medium">{folder}/</span>
                        <Badge variant="outline" className="border-white/20 text-gray-400 text-xs ml-auto">
                          {folderFiles.length} files
                        </Badge>
                      </div>
                    )}
                    
                    {folderFiles.map((file) => {
                      const IconComponent = getFileIcon(file.type, file.name);
                      const colorClass = getFileColor(file.type, file.name);
                      
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-4 p-3 rounded-lg glass-effect border border-white/10 ml-4"
                        >
                          <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate">{file.name}</h4>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            
                            {file.status === 'uploading' && (
                              <div className="mt-2">
                                <Progress value={file.progress} className="h-1" />
                              </div>
                            )}
                            
                            {file.extractedContent && (
                              <p className="text-xs text-green-400 mt-1">
                                ✓ Content extracted for AI analysis
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {file.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                            {file.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                            {file.status === 'pending' && (
                              <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)}>
                                <X className="w-3 h-3 text-gray-400" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="p-6 border-t border-white/10 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              <span className="font-medium">{files.filter(f => f.status === 'completed').length}</span> of <span className="font-medium">{files.length}</span> files uploaded
              {Object.keys(fileGroups).length > 1 && (
                <span className="ml-2">across {Object.keys(fileGroups).length - (fileGroups.root ? 1 : 0)} folders</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setFiles([])}>
                Clear All
              </Button>
              <Button 
                onClick={onClose}
                disabled={uploading}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {uploading ? 'Processing...' : 'Continue Chat'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
