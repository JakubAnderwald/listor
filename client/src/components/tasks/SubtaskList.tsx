import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Plus, MoreVertical, GripVertical, Trash2, Edit3 } from 'lucide-react';
import { Subtask, CreateSubtaskData, UpdateSubtaskData } from '../../types';
import { cn } from '../../lib/utils';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onCreateSubtask: (data: CreateSubtaskData) => Promise<void>;
  onUpdateSubtask: (subtaskId: string, data: UpdateSubtaskData) => Promise<void>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
  onReorderSubtasks?: (subtasks: Subtask[]) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  taskId,
  subtasks,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
  readOnly = false,
  className
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const sortedSubtasks = [...subtasks].sort((a, b) => a.order - b.order);
  const completedCount = subtasks.filter(subtask => subtask.status === 'completed').length;
  const totalCount = subtasks.length;

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    setIsCreating(true);
    try {
      const maxOrder = Math.max(...subtasks.map(s => s.order), -1);
      await onCreateSubtask({
        taskId,
        title: newSubtaskTitle.trim(),
        order: maxOrder + 1
      });
      setNewSubtaskTitle('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    const newStatus = subtask.status === 'completed' ? 'pending' : 'completed';
    await onUpdateSubtask(subtask.id, { status: newStatus });
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return;

    await onUpdateSubtask(editingId, { title: editingTitle.trim() });
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await onDeleteSubtask(subtaskId);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      if (editingId) {
        handleCancelEdit();
      }
    }
  };

  if (subtasks.length === 0 && readOnly) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Subtasks
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {completedCount}/{totalCount}
              </Badge>
            )}
          </CardTitle>
          {totalCount > 0 && (
            <span className="text-xs text-gray-500">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% complete
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* Existing Subtasks */}
        {sortedSubtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg border transition-colors",
              subtask.status === 'completed' && "bg-gray-50 dark:bg-gray-800"
            )}
          >
            {onReorderSubtasks && !readOnly && (
              <GripVertical className="h-3 w-3 text-gray-400 cursor-grab" />
            )}

            <Checkbox
              checked={subtask.status === 'completed'}
              onCheckedChange={() => handleToggleSubtask(subtask)}
              disabled={readOnly}
              className="flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              {editingId === subtask.id ? (
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, handleSaveEdit)}
                  onBlur={handleSaveEdit}
                  className="h-7 text-sm"
                  autoFocus
                />
              ) : (
                <span
                  className={cn(
                    "text-sm",
                    subtask.status === 'completed' && "line-through text-gray-500"
                  )}
                >
                  {subtask.title}
                </span>
              )}
            </div>

            {!readOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStartEdit(subtask)}>
                    <Edit3 className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}

        {/* Add New Subtask */}
        {!readOnly && (
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Add a subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, handleCreateSubtask)}
              disabled={isCreating}
              className="flex-1 h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={handleCreateSubtask}
              disabled={!newSubtaskTitle.trim() || isCreating}
              className="h-8 px-3"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Empty State */}
        {subtasks.length === 0 && !readOnly && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p className="text-xs">No subtasks yet</p>
            <p className="text-xs">Break this task into smaller steps</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};