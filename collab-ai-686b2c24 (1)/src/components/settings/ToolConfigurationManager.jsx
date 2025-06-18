
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  AlertCircle,
  Clock,
  Save,
  X,
  Link,
  Shield,
  Code,
  Play,
  Zap,
  FileText,
  Copy,
  Eye
} from 'lucide-react';
import { ToolConfiguration, AIToolSchema } from "@/api/entities";
import { testToolConfiguration } from "@/api/functions";

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4", color: "from-green-400 to-emerald-500", icon: "G" },
  { id: "claude-3", name: "Claude", color: "from-orange-400 to-red-500", icon: "C" },
  { id: "gemini-pro", name: "Gemini", color: "from-blue-400 to-purple-500", icon: "G" }
];

const EXAMPLE_SCHEMA = {
  "endpoints": [
    {
      "name": "analyze_data",
      "path": "/api/analyze",
      "method": "POST",
      "description": "Analyzes uploaded data and returns insights",
      "parameters": {
        "type": "object",
        "properties": {
          "data": {
            "type": "string",
            "description": "Raw data to analyze"
          },
          "analysis_type": {
            "type": "string",
            "enum": ["statistical", "trend", "sentiment"],
            "description": "Type of analysis to perform"
          }
        },
        "required": ["data"]
      },
      "response": {
        "type": "object",
        "properties": {
          "insights": {
            "type": "array",
            "items": {"type": "string"}
          },
          "confidence": {"type": "number"}
        }
      }
    }
  ]
};

export default function ToolConfigurationManager() {
  const [toolConfigs, setToolConfigs] = useState([]);
  const [toolSchemas, setToolSchemas] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showSchemaForm, setShowSchemaForm] = useState(false); // New state for AI schema form
  const [selectedModel, setSelectedModel] = useState(''); // Not used in current outline, but kept if needed later
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const [configForm, setConfigForm] = useState({
    name: '',
    description: '',
    base_url: '',
    endpoints_schema: '',
    common_headers: '',
    authentication: {
      type: 'none',
      token: '',
      header_name: ''
    }
  });

  const [schemaForm, setSchemaForm] = useState({
    id: null, // Added for editing
    ai_model: '',
    tool_name: '',
    description: '',
    endpoint_path: '',
    http_method: 'POST',
    parameters_schema: '',
    response_schema: '',
    usage_examples: ['']
  });

  useEffect(() => {
    loadToolConfigurations();
    loadToolSchemas();
  }, []);

  const loadToolConfigurations = async () => {
    try {
      const configs = await ToolConfiguration.list('-created_date');
      setToolConfigs(configs);
      if (configs.length > 0 && !activeConfig) {
        setActiveConfig(configs[0]);
      }
    } catch (error) {
      console.error('Failed to load tool configurations:', error);
    }
  };

  const loadToolSchemas = async () => {
    try {
      const schemas = await AIToolSchema.list('-created_date');
      setToolSchemas(schemas);
    } catch (error) {
      console.error('Failed to load tool schemas:', error);
    }
  };

  const saveToolConfiguration = async () => {
    try {
      const configData = {
        ...configForm,
        endpoints_schema: configForm.endpoints_schema || JSON.stringify(EXAMPLE_SCHEMA, null, 2),
        common_headers: configForm.common_headers || '{"Content-Type": "application/json"}'
      };

      if (activeConfig && activeConfig.id) { // Check for activeConfig.id to ensure it's an existing one
        await ToolConfiguration.update(activeConfig.id, configData);
      } else {
        await ToolConfiguration.create(configData);
      }

      setShowConfigForm(false);
      setConfigForm({
        name: '',
        description: '',
        base_url: '',
        endpoints_schema: '',
        common_headers: '',
        authentication: { type: 'none', token: '', header_name: '' }
      });
      loadToolConfigurations();
    } catch (error) {
      console.error('Failed to save tool configuration:', error);
    }
  };

  const saveToolSchema = async () => {
    if (!activeConfig) return;

    try {
      const schemaData = {
        ...schemaForm,
        tool_config_id: activeConfig.id,
        usage_examples: schemaForm.usage_examples.filter(e => e.trim() !== '')
      };

      if (schemaForm.id) {
        await AIToolSchema.update(schemaForm.id, schemaData);
      } else {
        await AIToolSchema.create(schemaData);
      }

      setShowSchemaForm(false);
      setSchemaForm({
        id: null,
        ai_model: '',
        tool_name: '',
        description: '',
        endpoint_path: '',
        http_method: 'POST',
        parameters_schema: '',
        response_schema: '',
        usage_examples: ['']
      });
      loadToolSchemas();
    } catch(error) {
      console.error('Failed to save tool schema:', error);
      alert('Failed to save tool schema.');
    }
  };

  const testConnection = async (configId) => {
    setIsTestingConnection(true);
    try {
      const { data } = await testToolConfiguration({ toolConfigId: configId });

      if (data.success) {
        alert(`✅ Connection successful!\nResponse time: ${data.response_time}ms\n${data.message}`);
      } else {
        alert(`❌ Connection failed:\n${data.error}`);
      }

      loadToolConfigurations(); // Refresh to get updated test status
    } catch (error) {
      alert(`❌ Test failed: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const editConfig = (config) => {
    setActiveConfig(config);
    setConfigForm({
      name: config.name,
      description: config.description || '',
      base_url: config.base_url,
      endpoints_schema: config.endpoints_schema || JSON.stringify(EXAMPLE_SCHEMA, null, 2),
      common_headers: config.common_headers || '{"Content-Type": "application/json"}',
      authentication: config.authentication || { type: 'none', token: '', header_name: '' }
    });
    setShowConfigForm(true);
  };

  const deleteConfig = async (configId) => {
    if (confirm('Are you sure you want to delete this tool configuration?')) {
      try {
        await ToolConfiguration.delete(configId);
        loadToolConfigurations();
        if (activeConfig?.id === configId) {
          setActiveConfig(null);
        }
      } catch (error) {
        console.error('Failed to delete configuration:', error);
      }
    }
  };

  const editSchema = (schema) => {
    setSchemaForm({
      ...schema,
      usage_examples: schema.usage_examples ? [...schema.usage_examples, ''] : ['']
    });
    setShowSchemaForm(true);
  };

  const deleteSchema = async (schemaId) => {
    if (confirm('Are you sure you want to delete this AI tool schema?')) {
      try {
        await AIToolSchema.delete(schemaId);
        loadToolSchemas();
      } catch (error) {
        console.error('Failed to delete schema:', error);
      }
    }
  };

  const copySchemaExample = () => {
    navigator.clipboard.writeText(JSON.stringify(EXAMPLE_SCHEMA, null, 2));
    alert('Example schema copied to clipboard!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'failed': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-3 h-3" />;
      case 'failed': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const activeConfigSchemas = toolSchemas.filter(s => s.tool_config_id === activeConfig?.id);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">API Tool Configurations</h3>
          <p className="text-sm text-gray-400">Connect your ngrok-tunneled APIs for AI tool use</p>
        </div>
        <Button
          onClick={() => {
            setActiveConfig(null);
            setConfigForm({
              name: '',
              description: '',
              base_url: '',
              endpoints_schema: JSON.stringify(EXAMPLE_SCHEMA, null, 2),
              common_headers: '{"Content-Type": "application/json"}',
              authentication: { type: 'none', token: '', header_name: '' }
            });
            setShowConfigForm(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add API Configuration
        </Button>
      </div>

      {/* Configuration List */}
      <div className="grid gap-4">
        <AnimatePresence>
          {toolConfigs.map((config) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="glass-effect border-white/10 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => setActiveConfig(config)} // Add click to set active config
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">{config.name}</h4>
                        <Badge className={`text-xs ${getStatusColor(config.test_status)}`}>
                          {getStatusIcon(config.test_status)}
                          <span className="ml-1">{config.test_status || 'untested'}</span>
                        </Badge>
                        {config.is_active && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Active
                          </Badge>
                        )}
                        {activeConfig?.id === config.id && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                              Selected
                            </Badge>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-3">{config.description}</p>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-300 font-mono">{config.base_url}</span>
                        </div>

                        {config.authentication?.type !== 'none' && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-300">{config.authentication.type}</span>
                          </div>
                        )}

                        {config.last_tested && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">
                              {new Date(config.last_tested).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); testConnection(config.id); }} // Stop propagation
                        disabled={isTestingConnection}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        {isTestingConnection ? (
                          <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                        Test
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); editConfig(config); }} // Stop propagation
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); deleteConfig(config.id); }} // Stop propagation
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {toolConfigs.length === 0 && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No API configurations yet</p>
            <Button
              onClick={() => setShowConfigForm(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Configuration
            </Button>
          </div>
        )}
      </div>

      {/* AI Tool Schema Section */}
      <AnimatePresence>
        {activeConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">AI-Specific Tool Schemas for "{activeConfig.name}"</h3>
                <p className="text-sm text-gray-400">Define how each AI should see and use your tools.</p>
              </div>
              <Button
                onClick={() => {
                  setSchemaForm({
                    id: null,
                    ai_model: '',
                    tool_name: '',
                    description: '',
                    endpoint_path: '',
                    http_method: 'POST',
                    parameters_schema: '',
                    response_schema: '',
                    usage_examples: ['']
                  });
                  setShowSchemaForm(true);
                }}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add AI Schema
              </Button>
            </div>

            <div className="grid gap-4">
              {activeConfigSchemas.length > 0 ? (
                activeConfigSchemas.map(schema => {
                  const modelInfo = AI_MODELS.find(m => m.id === schema.ai_model);
                  return (
                    <Card key={schema.id} className="glass-effect border-white/10">
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 bg-gradient-to-br ${modelInfo?.color} rounded-lg flex items-center justify-center`}>
                              <p className="font-bold text-white text-xl">{modelInfo?.icon}</p>
                           </div>
                           <div>
                              <h4 className="font-semibold text-white">{schema.tool_name}</h4>
                              <p className="text-sm text-gray-400">{modelInfo?.name}</p>
                           </div>
                        </div>
                         <div className="flex items-center gap-2">
                           <Button variant="outline" size="sm" onClick={() => editSchema(schema)} className="border-white/20 text-white hover:bg-white/10"><Edit className="w-4 h-4" /></Button>
                           <Button variant="outline" size="sm" onClick={() => deleteSchema(schema.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                         </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-300 mb-2">{schema.description}</p>
                        <div className="flex items-center gap-2 text-xs font-mono">
                           <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">{schema.http_method}</Badge>
                           <span className="text-gray-400">{schema.endpoint_path}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No AI-specific schemas for this configuration yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Form Modal */}
      <AnimatePresence>
        {showConfigForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-effect border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    {activeConfig ? 'Edit' : 'Create'} API Configuration
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfigForm(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="max-h-[calc(90vh-140px)]">
                <div className="p-6 space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="auth">Authentication</TabsTrigger>
                      <TabsTrigger value="schema">Endpoints Schema</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Configuration Name</Label>
                          <Input
                            value={configForm.name}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="My Flask API"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Base URL (ngrok tunnel)</Label>
                          <Input
                            value={configForm.base_url}
                            onChange={(e) => setConfigForm(prev => ({ ...prev, base_url: e.target.value }))}
                            placeholder="https://abc123.ngrok.io"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white">Description</Label>
                        <Textarea
                          value={configForm.description}
                          onChange={(e) => setConfigForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what this API does..."
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Common Headers (JSON)</Label>
                        <Textarea
                          value={configForm.common_headers}
                          onChange={(e) => setConfigForm(prev => ({ ...prev, common_headers: e.target.value }))}
                          placeholder='{"Content-Type": "application/json"}'
                          className="bg-white/5 border-white/10 text-white font-mono"
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="auth" className="space-y-4">
                      <div>
                        <Label className="text-white">Authentication Type</Label>
                        <Select
                          value={configForm.authentication.type}
                          onValueChange={(value) =>
                            setConfigForm(prev => ({
                              ...prev,
                              authentication: { ...prev.authentication, type: value }
                            }))
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Authentication</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="api_key">API Key</SelectItem>
                            <SelectItem value="basic">Basic Auth</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {configForm.authentication.type !== 'none' && (
                        <>
                          <div>
                            <Label className="text-white">
                              {configForm.authentication.type === 'basic' ? 'Username:Password' : 'Token/API Key'}
                            </Label>
                            <Input
                              type="password"
                              value={configForm.authentication.token}
                              onChange={(e) =>
                                setConfigForm(prev => ({
                                  ...prev,
                                  authentication: { ...prev.authentication, token: e.target.value }
                                }))
                              }
                              placeholder="Enter your token/key"
                              className="bg-white/5 border-white/10 text-white"
                            />
                          </div>

                          {configForm.authentication.type === 'api_key' && (
                            <div>
                              <Label className="text-white">Header Name (optional)</Label>
                              <Input
                                value={configForm.authentication.header_name}
                                onChange={(e) =>
                                  setConfigForm(prev => ({
                                    ...prev,
                                    authentication: { ...prev.authentication, header_name: e.target.value }
                                  }))
                                }
                                placeholder="X-API-Key (default if empty)"
                                className="bg-white/5 border-white/10 text-white"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="schema" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Endpoints Schema (JSON)</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copySchemaExample}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Example
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSchemaPreview(!showSchemaPreview)}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {showSchemaPreview ? 'Hide' : 'Show'} Preview
                          </Button>
                        </div>
                      </div>

                      <Textarea
                        value={configForm.endpoints_schema}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, endpoints_schema: e.target.value }))}
                        placeholder={JSON.stringify(EXAMPLE_SCHEMA, null, 2)}
                        className="bg-white/5 border-white/10 text-white font-mono"
                        rows={15}
                      />

                      {showSchemaPreview && (
                        <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                          <h4 className="text-white font-medium mb-2">Schema Preview:</h4>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(JSON.parse(configForm.endpoints_schema || '{}'), null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <h4 className="text-blue-300 font-medium mb-2">Schema Structure:</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• <code>endpoints</code>: Array of available API endpoints</li>
                          <li>• <code>name</code>: Unique identifier for the endpoint</li>
                          <li>• <code>path</code>: API path (e.g., "/api/analyze")</li>
                          <li>• <code>method</code>: HTTP method (GET, POST, PUT, DELETE)</li>
                          <li>• <code>parameters</code>: JSON schema for input parameters</li>
                          <li>• <code>response</code>: Expected response structure (optional)</li>
                        </ul>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfigForm(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveToolConfiguration}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Schema Form Modal */}
      <AnimatePresence>
        {showSchemaForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-effect border border-white/10 rounded-xl w-full max-w-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{schemaForm.id ? 'Edit' : 'Create'} AI Tool Schema</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowSchemaForm(false)}><X className="w-5 h-5" /></Button>
              </div>
              <ScrollArea className="max-h-[70vh]">
                <div className="p-6 space-y-4">
                  <div>
                    <Label className="text-white">Target AI Model</Label>
                    <Select value={schemaForm.ai_model} onValueChange={(v) => setSchemaForm(p => ({ ...p, ai_model: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select an AI model" /></SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Tool Name for AI</Label>
                    <Input value={schemaForm.tool_name} onChange={(e) => setSchemaForm(p => ({ ...p, tool_name: e.target.value }))} placeholder="e.g., analyze_financial_data" className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">Tool Description for AI</Label>
                    <Textarea value={schemaForm.description} onChange={(e) => setSchemaForm(p => ({ ...p, description: e.target.value }))} placeholder="A short, clear description of what this tool does." className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Endpoint Path</Label>
                      <Input value={schemaForm.endpoint_path} onChange={(e) => setSchemaForm(p => ({ ...p, endpoint_path: e.target.value }))} placeholder="/api/finance/analyze" className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label className="text-white">HTTP Method</Label>
                      <Select value={schemaForm.http_method} onValueChange={(v) => setSchemaForm(p => ({ ...p, http_method: v }))}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Parameters Schema (JSON)</Label>
                    <Textarea value={schemaForm.parameters_schema} onChange={(e) => setSchemaForm(p => ({ ...p, parameters_schema: e.target.value }))} placeholder='{"type": "object", "properties": {...}}' className="bg-white/5 border-white/10 text-white font-mono" rows={6} />
                  </div>
                </div>
              </ScrollArea>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowSchemaForm(false)} className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
                <Button onClick={saveToolSchema} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save AI Schema
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
