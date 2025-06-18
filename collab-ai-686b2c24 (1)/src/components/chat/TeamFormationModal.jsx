import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, BrainCircuit, Mic, ChevronDown, RefreshCw } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

const AGENT_ROLES = [
  "Project Manager",
  "Lead Developer", 
  "Senior Developer",
  "Researcher",
  "Content Strategist",
  "Data Analyst",
  "Quality Assurance",
  "UX/UI Designer",
  "DevOps Engineer",
  "Business Analyst",
  "Technical Writer",
  "Solution Architect"
];

export default function TeamFormationModal({
  isOpen,
  onClose,
  onConfirm,
  initialPrompt,
  models
}) {
  const [proposedRoles, setProposedRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenegotiating, setIsRenegotiating] = useState(false);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      negotiateRoles();
    }
  }, [isOpen, initialPrompt]);

  const negotiateRoles = async () => {
    setIsLoading(true);
    
    const prompt = `
      An AI team is being assembled to tackle the following user request: "${initialPrompt}"

      The team consists of the following AI models:
      ${models.map(m => `- ${m.name} (${m.id}): Known for being ${m.personality}.`).join('\n')}

      Your task is to collectively decide on the best role for each AI model to maximize the team's effectiveness for this specific request. 
      Consider the strengths of each model type and the nature of the request.

      Additionally, analyze if this request would benefit from dynamic role reassignment during the conversation. Some projects might need roles to evolve as the conversation progresses.
      
      Respond with a JSON object containing:
      1. "roles": An array of objects with "model_id", "assigned_role", and "justification"
      2. "allow_dynamic_reassignment": Boolean indicating if roles should be allowed to change during conversation
      3. "reassignment_triggers": Array of scenarios that might trigger role changes (if dynamic reassignment is enabled)
      
      Available roles: ${AGENT_ROLES.join(', ')}.
    `;

    const responseSchema = {
      type: "object",
      properties: {
        roles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              model_id: { type: "string" },
              assigned_role: { type: "string" },
              justification: { type: "string" },
            },
            required: ["model_id", "assigned_role", "justification"]
          }
        },
        allow_dynamic_reassignment: { type: "boolean" },
        reassignment_triggers: {
          type: "array",
          items: { type: "string" }
        }
      }
    };

    try {
      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: responseSchema
      });
      
      const rolesWithModelInfo = result.roles.map(role => {
        const modelInfo = models.find(m => m.id === role.model_id);
        return { ...role, ...modelInfo, ...result };
      });
      
      setProposedRoles(rolesWithModelInfo);
    } catch (error) {
      console.error("Failed to negotiate roles:", error);
      // Fallback to a default assignment
      const fallbackRoles = models.map((model, index) => ({
        ...model,
        model_id: model.id,
        assigned_role: AGENT_ROLES[index % AGENT_ROLES.length],
        justification: "Fell back to default assignment due to an error.",
        allow_dynamic_reassignment: false,
        reassignment_triggers: []
      }));
      setProposedRoles(fallbackRoles);
    } finally {
      setIsLoading(false);
    }
  };

  const renegotiateRoles = async () => {
    setIsRenegotiating(true);
    await negotiateRoles();
    setIsRenegotiating(false);
  };

  const handleRoleChange = (modelId, newRole) => {
    setProposedRoles(prev =>
      prev.map(role =>
        role.model_id === modelId ? { ...role, assigned_role: newRole } : role
      )
    );
  };
  
  const handleConfirm = () => {
    const finalRoles = proposedRoles.reduce((acc, role) => {
      acc[role.model_id] = role.assigned_role;
      return acc;
    }, {});
    
    // Include metadata about dynamic reassignment
    const roleMetadata = {
      roles: finalRoles,
      allow_dynamic_reassignment: proposedRoles[0]?.allow_dynamic_reassignment || false,
      reassignment_triggers: proposedRoles[0]?.reassignment_triggers || []
    };
    
    onConfirm(roleMetadata);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect max-w-3xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            AI Team Formation
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            The AI team is analyzing your request and assigning roles. You can review and override their decisions.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Negotiating roles and analyzing collaboration strategy...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Dynamic Role Assignment Info */}
              {proposedRoles[0]?.allow_dynamic_reassignment && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                  <h4 className="text-blue-400 font-medium mb-2">🔄 Dynamic Role Assignment Enabled</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    Roles may change during the conversation based on project needs.
                  </p>
                  {proposedRoles[0]?.reassignment_triggers?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Potential triggers:</p>
                      <ul className="text-xs text-gray-300 list-disc list-inside">
                        {proposedRoles[0].reassignment_triggers.map((trigger, index) => (
                          <li key={index}>{trigger}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {proposedRoles.map((role) => (
                <div key={role.model_id} className="glass-effect p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${role.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-lg">{role.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{role.name}</h4>
                      <p className="text-sm text-gray-400 italic">"{role.justification}"</p>
                    </div>
                    <Select
                      value={role.assigned_role}
                      onValueChange={(newRole) => handleRoleChange(role.model_id, newRole)}
                    >
                      <SelectTrigger className="w-56 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {AGENT_ROLES.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <DialogFooter className="p-6 bg-black/20 flex justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={renegotiateRoles}
              disabled={isLoading || isRenegotiating}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {isRenegotiating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Renegotiating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renegotiate
                </>
              )}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              Confirm Team & Start
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}