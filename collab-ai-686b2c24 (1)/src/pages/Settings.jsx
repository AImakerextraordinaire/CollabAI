
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Palette,
  Zap,
  Shield,
  Download,
  Trash2,
  Bell,
  Moon,
  Sun,
  Key,
  CheckCircle,
  PlusCircle,
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import ToolConfigurationManager from "../components/settings/ToolConfigurationManager";
import { User, AIMemory } from "@/api/entities";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    theme: "dark",
    notifications: true,
    autoSave: true,
    comparisonMode: false,
    defaultModel: "gpt-4",
    maxTokens: 4000,
    temperature: 0.7
  });

  const [apiKeys, setApiKeys] = useState({
    "gpt-4": "",
    "claude-3": "",
    "gemini-pro": ""
  });
  const [connectedModels, setConnectedModels] = useState([]);
  const [uploadingStates, setUploadingStates] = useState({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.log("Not authenticated:", error.message);
        setUser(null); // Ensure user is null if not authenticated
      }
    };
    loadInitialData();
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleApiKeyChange = (modelId, value) => {
    setApiKeys(prev => ({...prev, [modelId]: value}));
  };

  const connectModel = (modelId) => {
    if (apiKeys[modelId]) {
      setConnectedModels(prev => [...new Set([...prev, modelId])]);
    }
  };

  const handleKnowledgeUpload = async (e, modelId) => {
    const files = Array.from(e.target.files || []); // Get all selected files
    if (files.length === 0) return;

    setUploadingStates(prev => ({ ...prev, [modelId]: true }));

    try {
      let totalMemoriesAdded = 0; // Track total memories added across all files
      
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // 1. Upload the file to get a URL
          const { file_url } = await UploadFile({ file });
          
          // 2. Use an LLM to analyze the file and extract memories
          const prompt = `Analyze the content of the attached file "${file.name}", which contains conversation history with an AI. Extract key memories and structure them into a JSON array. Focus on:

- Factual information the user shared about themselves, their work, or interests
- User preferences for communication style, topics, or approaches
- Important skills, knowledge areas, or expertise the user demonstrated
- Recurring themes or patterns in conversations
- Personal details that would help maintain conversational continuity

For each memory, assign an importance score from 1-10 based on how valuable it would be for future conversations.

File ${i + 1} of ${files.length}: ${file.name}`;
          
          const memorySchema = {
            type: "object",
            properties: {
              memories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    memory_type: { 
                      type: "string", 
                      enum: ["factual", "preference", "skill", "conversational"], 
                      description: "The type of memory." 
                    },
                    key: { 
                      type: "string", 
                      description: "A short, unique key for the memory (e.g., 'user_works_in_ai', 'prefers_detailed_explanations')." 
                    },
                    content: { 
                      type: "string", 
                      description: "The detailed content of the memory." 
                    },
                    context: { 
                      type: "string", 
                      description: "Context about when/how this memory was formed (e.g., 'From conversation about career goals')." 
                    },
                    importance_score: { 
                      type: "number", 
                      minimum: 1, 
                      maximum: 10, 
                      description: "Importance score from 1 to 10." 
                    }
                  },
                  required: ["memory_type", "key", "content", "importance_score"]
                }
              }
            }
          };

          const result = await InvokeLLM({
            prompt: prompt,
            file_urls: [file_url],
            response_json_schema: memorySchema
          });

          // 3. Save the extracted memories to the database
          if (result && result.memories && result.memories.length > 0) {
            const memoriesToCreate = result.memories.map(mem => ({
              ...mem,
              ai_model: modelId,
              context: mem.context || `Extracted from ${file.name}`,
              embedding_vector: '[]' // Placeholder for future vector search
            }));

            await AIMemory.bulkCreate(memoriesToCreate);
            totalMemoriesAdded += memoriesToCreate.length;
          } else {
            console.log(`No memories extracted from ${file.name}.`);
          }

        } catch (fileError) {
          console.error(`Failed to process file ${file.name}:`, fileError);
          // Continue with other files even if one fails
        }
      }

      // Update memory count in UI
      if (totalMemoriesAdded > 0) {
        alert(`Successfully processed ${files.length} files and added ${totalMemoriesAdded} memories to ${modelId}'s knowledge base!`);
      } else {
        alert("No new memories were extracted from the uploaded files.");
      }

    } catch (error) {
      console.error("Failed to process knowledge base:", error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setUploadingStates(prev => ({ ...prev, [modelId]: false }));
      e.target.value = null; // Reset file input to allow re-uploading the same file
    }
  };

  const models = [
    { id: "gpt-4", name: "GPT-4", status: "active", color: "from-purple-400 to-blue-400", icon: "G4" },
    { id: "claude-3", name: "Claude 3", status: "active", color: "from-orange-400 to-red-400", icon: "C3" },
    { id: "gemini-pro", name: "Gemini Pro", status: "active", color: "from-green-400 to-cyan-400", icon: "GP" }
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Customize your AI collaboration experience</p>
          {user?.is_admin && (
            <div className="mt-2 text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded inline-block">
              👑 Admin Access - All features unlocked
            </div>
          )}
        </div>

        <div className="grid gap-8">
          {/* Tool Configuration Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Custom API Tools
                </CardTitle>
                <p className="text-sm text-gray-400">Connect your own APIs for advanced AI tool use</p>
              </CardHeader>
              <CardContent>
                <ToolConfigurationManager />
              </CardContent>
            </Card>
          </motion.div>

          {/* Knowledge Base Seeding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  AI Knowledge Bases
                </CardTitle>
                <p className="text-sm text-gray-400">
                  Upload multiple chat logs (.txt, .md, .docx) to build each AI's memory. 
                  You can select multiple files at once for bulk import.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {models.map((model) => (
                  <div key={`kb-${model.id}`} className="p-4 rounded-lg glass-effect border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${model.color} rounded-lg flex items-center justify-center`}>
                        <p className="font-bold text-white text-xl">{model.icon}</p>
                      </div>
                      <div>
                        <p className="font-medium text-white">{model.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {uploadingStates[model.id] ? (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Loader2 className="w-4 h-4 animate-spin"/>
                          <span>Processing files...</span>
                        </div>
                      ) : (
                        <label htmlFor={`upload-${model.id}`}>
                          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 cursor-pointer">
                            <div>
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Upload Files
                            </div>
                          </Button>
                          <input
                            id={`upload-${model.id}`}
                            type="file"
                            className="hidden"
                            accept=".txt,.md,.docx"
                            multiple
                            onChange={(e) => handleKnowledgeUpload(e, model.id)}
                            disabled={uploadingStates[model.id]}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white">Theme</Label>
                    <p className="text-sm text-gray-400">Choose your preferred interface theme</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-gray-400" />
                    <Switch
                      checked={settings.theme === "dark"}
                      onCheckedChange={(checked) => handleSettingChange("theme", checked ? "dark" : "light")}
                    />
                    <Moon className="w-4 h-4 text-white" />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white">Notifications</Label>
                    <p className="text-sm text-gray-400">Get notified about response completions</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white">Auto-save Conversations</Label>
                    <p className="text-sm text-gray-400">Automatically save your conversations</p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => handleSettingChange("autoSave", checked)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white">Default Comparison Mode</Label>
                    <p className="text-sm text-gray-400">Start new conversations in comparison mode</p>
                  </div>
                  <Switch
                    checked={settings.comparisonMode}
                    onCheckedChange={(checked) => handleSettingChange("comparisonMode", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Model Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Connect Your AI Models
                </CardTitle>
                 <p className="text-sm text-gray-400">Add your API keys to enable the models for collaboration.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {models.map((model) => (
                    <div key={model.id} className="p-4 rounded-lg glass-effect border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${model.color} rounded-lg flex items-center justify-center`}>
                            <p className="font-bold text-white text-xl">{model.icon}</p>
                          </div>
                          <div>
                            <p className="font-medium text-white text-lg">{model.name}</p>
                          </div>
                        </div>
                        {connectedModels.includes(model.id) ? (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3"/>
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                                Not Connected
                            </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <Input
                                type="password"
                                placeholder={`Enter ${model.name} API Key`}
                                value={apiKeys[model.id]}
                                onChange={(e) => handleApiKeyChange(model.id, e.target.value)}
                                className="bg-white/5 border-white/10 text-white pl-9"
                            />
                          </div>
                          <Button
                            onClick={() => connectModel(model.id)}
                            disabled={!apiKeys[model.id] || connectedModels.includes(model.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Connect
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md::grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Conversations
                  </Button>

                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-400">Privacy Notice</h4>
                      <p className="text-sm text-gray-300 mt-1">
                        Your conversation data is stored locally and encrypted. We never share your conversations with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
