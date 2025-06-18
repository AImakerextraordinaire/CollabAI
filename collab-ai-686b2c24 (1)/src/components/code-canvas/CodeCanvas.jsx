
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Code,
  Play,
  Save,
  Copy,
  Download,
  FileText,
  GitBranch,
  Users,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Plus // Added Plus icon
} from 'lucide-react';
import { CodeCanvas as CodeCanvasEntity } from "@/api/entities";

const LANGUAGE_COLORS = {
  javascript: 'from-yellow-400 to-orange-500',
  python: 'from-blue-400 to-green-500',
  html: 'from-orange-400 to-red-500',
  css: 'from-blue-400 to-purple-500',
  react: 'from-cyan-400 to-blue-500',
  typescript: 'from-blue-500 to-purple-500',
  json: 'from-green-400 to-teal-500',
  markdown: 'from-gray-400 to-gray-600',
  sql: 'from-indigo-400 to-purple-500'
};

const LANGUAGE_ICONS = {
  javascript: '🟨',
  python: '🐍',
  html: '🌐',
  css: '🎨',
  react: '⚛️',
  typescript: '🔷',
  json: '📄',
  markdown: '📝',
  sql: '🗃️'
};

// --- Project Template Selector Component ---
const ProjectTemplateSelector = ({ isVisible, onClose, onSelectTemplate }) => {
  if (!isVisible) return null;

  const templates = [
    {
      title: 'JavaScript Hello World',
      description: 'A basic "Hello World" in JavaScript.',
      language: 'javascript',
      code_content: '// Simple JavaScript Hello World\nconsole.log("Hello, CollabAI!");'
    },
    {
      title: 'Python Calculator',
      description: 'A simple Python function for addition.',
      language: 'python',
      code_content: '# Python Addition Function\ndef add(a, b):\n  return a + b\n\nprint(f"2 + 3 = {add(2, 3)}")'
    },
    {
      title: 'HTML Boilerplate',
      description: 'A basic HTML5 page structure.',
      language: 'html',
      code_content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Web Page</title>\n</head>\n<body>\n  <h1>Welcome!</h1>\n  <p>This is a simple HTML page.</p>\n</body>\n</html>'
    },
    {
      title: 'React Functional Component',
      description: 'A basic React functional component example.',
      language: 'react',
      code_content: 'import React from \'react\';\n\nfunction MyComponent() {\n  return (\n    <div>\n      <h1>Hello from React!</h1>\n      <p>This is a functional component.</p>\n    </div>\n  );\n}\n\nexport default MyComponent;'
    },
    {
      title: 'CSS Styling Example',
      description: 'A basic CSS example to style a div.',
      language: 'css',
      code_content: '/* Basic CSS Styling */\n.container {\n  background-color: #333;\n  color: white;\n  padding: 20px;\n  border-radius: 8px;\n  font-family: sans-serif;\n}\n\nh1 {\n  color: #61dafb;\n}'
    },
    {
      title: 'TypeScript Interface',
      description: 'An example of a TypeScript interface and type usage.',
      language: 'typescript',
      code_content: 'interface User {\n  id: number;\n  name: string;\n  email?: string;\n}\n\nconst user: User = {\n  id: 1,\n  name: "Alice"\n};\n\nconsole.log(user.name);'
    },
    {
      title: 'JSON Data Structure',
      description: 'A common JSON object structure.',
      language: 'json',
      code_content: '{\n  "name": "CollabAI Project",\n  "version": "1.0.0",\n  "features": [\n    "realtime collaboration",\n    "AI assistance",\n    "code execution"\n  ],\n  "author": "CollabAI Team"\n}'
    },
    {
      title: 'Markdown Readme',
      description: 'A basic Markdown README file.',
      language: 'markdown',
      code_content: '# Project Title\n\nThis is a sample project generated from a template.\n\n## Features\n\n- Feature 1\n- Feature 2\n\n## Usage\n\n```javascript\nconsole.log("Hello world");\n```\n'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Choose a Project Template</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-all duration-200"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 bg-gradient-to-r ${LANGUAGE_COLORS[template.language]} rounded-md flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xl">{LANGUAGE_ICONS[template.language]}</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{template.title}</h3>
              </div>
              <p className="text-gray-400 text-sm">{template.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <Button onClick={onClose} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Cancel
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function CodeCanvas({
  conversationId,
  isVisible,
  onClose,
  onCodeUpdate,
  currentCanvas,
  aiModifications = []
}) {
  const [canvas, setCanvas] = useState(currentCanvas || {
    title: 'New Project',
    description: '',
    language: 'javascript',
    code_content: '// Welcome to the collaborative code canvas!\n// AIs will help you build amazing projects here.\n\nfunction hello() {\n  console.log("Hello from CollabAI!");\n}\n\nhello();',
    version: 1
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [executionResult, setExecutionResult] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false); // New state for template selector

  useEffect(() => {
    if (currentCanvas) {
      setCanvas(currentCanvas);
    }
  }, [currentCanvas]);

  const saveCanvas = async () => {
    if (!conversationId) return;

    setIsSaving(true);
    try {
      let savedCanvas;
      if (canvas.id) {
        savedCanvas = await CodeCanvasEntity.update(canvas.id, {
          ...canvas,
          version: canvas.version + 1,
          last_modified_by: 'User'
        });
      }
      else {
        savedCanvas = await CodeCanvasEntity.create({
          ...canvas,
          conversation_id: conversationId,
          last_modified_by: 'User'
        });
      }

      setCanvas(savedCanvas);
      setLastSaved(new Date());
      onCodeUpdate?.(savedCanvas);
    } catch (error) {
      console.error('Failed to save canvas:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const executeCode = () => {
    // Simple code execution simulation
    if (canvas.language === 'javascript') {
      try {
        // Create a safe execution context
        const logs = [];
        const mockConsole = {
          log: (...args) => logs.push(args.join(' '))
        };

        // Replace console.log calls
        const code = canvas.code_content.replace(/console\.log/g, 'mockConsole.log');

        // Execute in a controlled way
        const func = new Function('mockConsole', code);
        func(mockConsole);

        setExecutionResult(logs.join('\n') || 'Code executed successfully (no output)');
      } catch (error) {
        setExecutionResult(`Error: ${error.message}`);
      }
    } else {
      setExecutionResult('Code execution is currently only available for JavaScript');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(canvas.code_content);
  };

  const downloadCode = () => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      html: 'html',
      css: 'css',
      react: 'jsx',
      typescript: 'ts',
      json: 'json',
      markdown: 'md',
      sql: 'sql'
    };

    const blob = new Blob([canvas.code_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${canvas.title.replace(/\s+/g, '_')}.${extensions[canvas.language] || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTemplateSelect = (templateData) => {
    setCanvas(prev => ({
      ...prev,
      ...templateData,
      conversation_id: conversationId, // Ensure new canvas gets conversation_id
      // Reset version for new template, or keep as 1 if it's a new canvas
      version: 1,
      id: undefined // New template implies a new canvas, so clear existing ID
    }));
    setShowTemplateSelector(false);
    setExecutionResult(''); // Clear previous execution result
  };

  if (!isVisible) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed inset-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl z-50 flex flex-col ${
          isExpanded ? '' : 'max-h-[80vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 bg-gradient-to-r ${LANGUAGE_COLORS[canvas.language]} rounded-lg flex items-center justify-center`}>
              <span className="text-2xl">{LANGUAGE_ICONS[canvas.language]}</span>
            </div>
            <div className="flex-1">
              <Input
                value={canvas.title}
                onChange={(e) => setCanvas(prev => ({ ...prev, title: e.target.value }))}
                className="text-lg font-bold bg-transparent border-none text-white p-0 h-auto focus:bg-white/5 rounded"
                placeholder="Project Title"
              />
              <Input
                value={canvas.description}
                onChange={(e) => setCanvas(prev => ({ ...prev, description: e.target.value }))}
                className="text-sm bg-transparent border-none text-gray-400 p-0 h-auto mt-1 focus:bg-white/5 rounded"
                placeholder="Project description..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Templates
            </Button>

            <Select
              value={canvas.language}
              onValueChange={(value) => setCanvas(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(LANGUAGE_COLORS).map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_ICONS[lang]} {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 text-gray-300 flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              v{canvas.version}
            </Badge>

            {canvas.last_modified_by && (
              <Badge variant="outline" className="border-white/20 text-gray-300 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {canvas.last_modified_by}
              </Badge>
            )}

            {lastSaved && (
              <span className="text-xs text-gray-400">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadCode}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>

            {canvas.language === 'javascript' && (
              <Button
                variant="outline"
                size="sm"
                onClick={executeCode}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Run
              </Button>
            )}

            <Button
              size="sm"
              onClick={saveCanvas}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex">
          <div className="flex-1 relative">
            <Textarea
              value={canvas.code_content}
              onChange={(e) => setCanvas(prev => ({ ...prev, code_content: e.target.value }))}
              className="absolute inset-0 bg-slate-900 border-none text-white font-mono text-sm leading-relaxed resize-none focus:ring-0"
              placeholder="Start coding here..."
              style={{ minHeight: '100%' }}
            />
          </div>

          {/* Execution Results Panel */}
          {executionResult && (
            <div className="w-80 border-l border-white/10 bg-black/50">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Output
                </h3>
              </div>
              <div className="p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {executionResult}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* AI Modifications Indicator */}
        <AnimatePresence>
          {aiModifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-4 right-4 bg-blue-500/20 border border-blue-400/30 rounded-lg p-2"
            >
              <div className="flex items-center gap-2 text-blue-300 text-sm">
                <Code className="w-4 h-4" />
                <span>{aiModifications.length} AI modifications pending</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Template Selector */}
      <ProjectTemplateSelector
        isVisible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </>
  );
}
