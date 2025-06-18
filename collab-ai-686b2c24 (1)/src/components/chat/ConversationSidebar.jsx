
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  Search,
  Folder,
  FolderOpen,
  Archive,
  Pin,
  PinOff,
  Edit3,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChatFolder } from "@/api/entities";
import { Conversation } from "@/api/entities";

const FOLDER_COLORS = {
  blue: "from-blue-500 to-cyan-500",
  purple: "from-purple-500 to-pink-500", 
  green: "from-green-500 to-emerald-500",
  orange: "from-orange-500 to-red-500",
  red: "from-red-500 to-pink-500",
  pink: "from-pink-500 to-rose-500",
  indigo: "from-indigo-500 to-purple-500",
  teal: "from-teal-500 to-cyan-500"
};

export default function ConversationSidebar({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation
}) {
  const [folders, setFolders] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [selectedFolderColor, setSelectedFolderColor] = useState("blue");

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const folderData = await ChatFolder.filter({ is_archived: false }, "sort_order");
      setFolders(folderData);
      // Auto-expand folders that have conversations
      const foldersWithConversations = folderData.filter(folder => 
        conversations.some(conv => conv.folder_id === folder.id)
      );
      setExpandedFolders(new Set(foldersWithConversations.map(f => f.id)));
    } catch (error) {
      console.error("Failed to load folders:", error);
      setFolders([]);
    }
  };

  const createFolder = async () => {
    if (!newItemName.trim()) return;
    try {
      await ChatFolder.create({
        name: newItemName.trim(),
        color: selectedFolderColor,
        sort_order: folders.length
      });
      await loadFolders();
      setShowCreateFolder(false);
      setNewItemName("");
      setSelectedFolderColor("blue");
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const renameItem = async () => {
    if (!newItemName.trim() || !editingItem) return;
    try {
      if (editingItem.type === 'conversation') {
        await Conversation.update(editingItem.id, { title: newItemName.trim() });
        // Don't trigger conversation reload, just update the title locally (or rely on parent re-render)
      } else {
        await ChatFolder.update(editingItem.id, { name: newItemName.trim() });
        await loadFolders();
      }
      setEditingItem(null);
      setNewItemName("");
    } catch (error) {
      console.error("Failed to rename item:", error);
    }
  };

  const togglePin = async (conversation, event) => {
    event?.stopPropagation(); // Prevent event bubbling
    try {
      await Conversation.update(conversation.id, { 
        is_pinned: !conversation.is_pinned 
      });
      // Don't reload conversations, the parent will handle the update
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const toggleArchive = async (item, type, event) => {
    event?.stopPropagation(); // Prevent event bubbling
    try {
      if (type === 'conversation') {
        await Conversation.update(item.id, { 
          is_archived: !item.is_archived 
        });
      } else {
        await ChatFolder.update(item.id, { 
          is_archived: !item.is_archived 
        });
        await loadFolders();
      }
    } catch (error) {
      console.error("Failed to toggle archive:", error);
    }
  };

  const moveToFolder = async (conversationId, folderId, event) => {
    event?.stopPropagation(); // Prevent event bubbling
    try {
      await Conversation.update(conversationId, { folder_id: folderId });
    } catch (error) {
      console.error("Failed to move conversation:", error);
    }
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const filteredConversations = conversations.filter(conv => {
    if (conv.is_archived !== showArchived) return false;
    if (searchTerm && !conv.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group conversations
  const pinnedConversations = filteredConversations.filter(conv => conv.is_pinned && !conv.folder_id);
  const unorganizedConversations = filteredConversations.filter(conv => !conv.is_pinned && !conv.folder_id);
  const organizedConversations = filteredConversations.filter(conv => conv.folder_id);

  const renderConversation = (conversation, isInFolder = false) => (
    <motion.div
      key={conversation.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative ${isInFolder ? 'ml-6' : ''}`}
    >
      <div
        className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
          activeConversation?.id === conversation.id
            ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/20"
            : "hover:bg-white/5 border border-transparent"
        }`}
        onClick={() => onSelectConversation(conversation)}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {conversation.is_pinned && <Pin className="w-3 h-3 text-yellow-400" />}
              <h3 className="font-medium text-white text-sm truncate">
                {conversation.title}
              </h3>
            </div>
            {conversation.last_activity && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {format(new Date(conversation.last_activity), "MMM d, HH:mm")}
                </span>
              </div>
            )}
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()} // Prevent selecting conversation when clicking trigger
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[1000]">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation(); // Prevent selecting conversation
                  setEditingItem({ ...conversation, type: 'conversation' });
                  setNewItemName(conversation.title);
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent selecting conversation
                  togglePin(conversation, e);
                }}
              >
                {conversation.is_pinned ? (
                  <>
                    <PinOff className="w-4 h-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {folders.map(folder => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent selecting conversation
                    moveToFolder(conversation.id, folder.id, e);
                  }}
                >
                  <div className={`w-3 h-3 rounded bg-gradient-to-r ${FOLDER_COLORS[folder.color]} mr-2`} />
                  Move to {folder.name}
                </DropdownMenuItem>
              ))}
              {conversation.folder_id && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent selecting conversation
                    moveToFolder(conversation.id, null, e);
                  }}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Remove from folder
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent selecting conversation
                  toggleArchive(conversation, 'conversation', e);
                }}
              >
                <Archive className="w-4 h-4 mr-2" />
                {conversation.is_archived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <div className="w-80 border-r border-white/10 glass-effect flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 space-y-3">
          <Button
            onClick={onNewConversation}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
              className="text-gray-400 hover:text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              Folder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={`text-gray-400 hover:text-white ${showArchived ? 'bg-white/10' : ''}`}
            >
              <Archive className="w-3 h-3 mr-1" />
              {showArchived ? 'Hide' : 'Show'} Archived
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Pinned Conversations */}
            {pinnedConversations.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pinned
                </div>
                {pinnedConversations.map(conv => renderConversation(conv))}
              </div>
            )}

            {/* Folders */}
            {folders.map(folder => {
              const folderConversations = organizedConversations.filter(conv => conv.folder_id === folder.id);
              const isExpanded = expandedFolders.has(folder.id);

              return (
                <div key={folder.id} className="mb-2">
                  <div className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                    <div
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <div className={`w-4 h-4 rounded bg-gradient-to-r ${FOLDER_COLORS[folder.color]}`} />
                      <span className="text-sm font-medium text-white">{folder.name}</span>
                      {folderConversations.length > 0 && (
                        <Badge variant="outline" className="border-white/20 text-gray-400 text-xs">
                          {folderConversations.length}
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()} // Prevent expanding/collapsing folder when clicking trigger
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-[1000]">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent expanding/collapsing folder
                            setEditingItem({ ...folder, type: 'folder' });
                            setNewItemName(folder.name);
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation(); // Prevent expanding/collapsing folder
                          toggleArchive(folder, 'folder', e);
                        }}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 space-y-1"
                      >
                        {folderConversations.map(conv => renderConversation(conv, true))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Unorganized Conversations */}
            {unorganizedConversations.length > 0 && (
              <div>
                {(folders.length > 0 || pinnedConversations.length > 0) && (
                  <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Other
                  </div>
                )}
                {unorganizedConversations.map(conv => renderConversation(conv))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder} modal={true}>
        <DialogContent className="glass-effect border-white/10 fixed z-[1001]">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Color</label>
              <div className="flex gap-2">
                {Object.entries(FOLDER_COLORS).map(([color, gradient]) => (
                  <button
                    key={color}
                    onClick={() => setSelectedFolderColor(color)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${gradient} ${
                      selectedFolderColor === color ? 'ring-2 ring-white' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
            <Button onClick={createFolder} disabled={!newItemName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)} modal={true}>
        <DialogContent className="glass-effect border-white/10 fixed z-[1001]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Rename {editingItem?.type === 'folder' ? 'Folder' : 'Conversation'}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="New name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            onKeyPress={(e) => e.key === 'Enter' && renameItem()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={renameItem} disabled={!newItemName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
