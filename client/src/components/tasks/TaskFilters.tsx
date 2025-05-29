import React from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Filter, SortAsc, SortDesc, X, Calendar, Flag, CheckCircle } from 'lucide-react';
import { TaskFilter, TaskSort } from '../../types';

interface TaskFiltersProps {
  filter: TaskFilter;
  sort: TaskSort;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sort: TaskSort) => void;
  onClearFilters: () => void;
  taskCount: number;
  className?: string;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onClearFilters,
  taskCount,
  className
}) => {
  const hasActiveFilters = 
    filter.status !== 'all' ||
    filter.priority !== 'all' ||
    filter.assignedTo !== 'all' ||
    filter.dueDateRange?.start ||
    filter.dueDateRange?.end;

  const handleStatusChange = (status: string) => {
    onFilterChange({
      ...filter,
      status: status as 'pending' | 'completed' | 'all'
    });
  };

  const handlePriorityChange = (priority: string) => {
    onFilterChange({
      ...filter,
      priority: priority as 'low' | 'medium' | 'high' | 'all'
    });
  };

  const handleDueDateStartChange = (startDate: string) => {
    onFilterChange({
      ...filter,
      dueDateRange: {
        ...filter.dueDateRange,
        start: startDate || undefined
      }
    });
  };

  const handleDueDateEndChange = (endDate: string) => {
    onFilterChange({
      ...filter,
      dueDateRange: {
        ...filter.dueDateRange,
        end: endDate || undefined
      }
    });
  };

  const handleSortFieldChange = (field: string) => {
    onSortChange({
      field: field as TaskSort['field'],
      direction: sort.direction
    });
  };

  const toggleSortDirection = () => {
    onSortChange({
      field: sort.field,
      direction: sort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters & Sort</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {taskCount} tasks
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Status
              </label>
              <Select value={filter.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Flag className="h-3 w-3" />
                Priority
              </label>
              <Select value={filter.priority || 'all'} onValueChange={handlePriorityChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due After
              </label>
              <Input
                type="date"
                value={filter.dueDateRange?.start || ''}
                onChange={(e) => handleDueDateStartChange(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due Before
              </label>
              <Input
                type="date"
                value={filter.dueDateRange?.end || ''}
                onChange={(e) => handleDueDateEndChange(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <span className="text-sm font-medium">Sort by:</span>
            
            <Select value={sort.field} onValueChange={handleSortFieldChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="updatedAt">Updated Date</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortDirection}
              className="flex items-center gap-1"
            >
              {sort.direction === 'asc' ? (
                <SortAsc className="h-3 w-3" />
              ) : (
                <SortDesc className="h-3 w-3" />
              )}
              {sort.direction === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-xs text-gray-500">Active filters:</span>
              
              {filter.status !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Status: {filter.status}
                </Badge>
              )}
              
              {filter.priority !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Priority: {filter.priority}
                </Badge>
              )}
              
              {filter.dueDateRange?.start && (
                <Badge variant="outline" className="text-xs">
                  Due after: {new Date(filter.dueDateRange.start).toLocaleDateString()}
                </Badge>
              )}
              
              {filter.dueDateRange?.end && (
                <Badge variant="outline" className="text-xs">
                  Due before: {new Date(filter.dueDateRange.end).toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};