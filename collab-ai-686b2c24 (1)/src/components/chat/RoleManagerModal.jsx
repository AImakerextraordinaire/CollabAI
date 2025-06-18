import React, { useState, useEffect } from 'react';
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
import { Users } from 'lucide-react';

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

export default function RoleManagerModal({ isOpen, onClose, models, currentRoles, onSave }) {
  const [editedRoles, setEditedRoles] = useState(currentRoles || {});

  useEffect(() => {
    setEditedRoles(currentRoles || {});
  }, [currentRoles, isOpen]);

  const handleRoleChange = (modelId, newRole) => {
    setEditedRoles(prev => ({ ...prev, [modelId]: newRole }));
  };

  const handleSave = () => {
    onSave(editedRoles);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect max-w-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            Manage AI Team Roles
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Adjust the roles of your AI assistants to better suit the current task.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {models.map(model => (
            <div key={model.id} className="flex items-center justify-between gap-4 p-4 glass-effect rounded-lg border border-white/10">
              <div className='flex items-center gap-3'>
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}
                    style={{ backgroundColor: model.color }}
                  >
                      <span className="text-white font-bold text-lg">{model.icon}</span>
                  </div>
                  <span className="font-semibold text-white">{model.name}</span>
              </div>
              <Select
                value={editedRoles[model.id]}
                onValueChange={(newRole) => handleRoleChange(model.id, newRole)}
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
          ))}
        </div>

        <DialogFooter className="p-6 bg-black/20 flex justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}