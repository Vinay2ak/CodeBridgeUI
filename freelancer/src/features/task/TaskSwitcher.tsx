import React from "react";
import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../../services/workspace/api";
import { setTaskId } from "../../lib/taskParam";
import { Select, SelectOption } from "../../components/ui/Select";

interface TaskSwitcherProps {
  currentTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

export const TaskSwitcher: React.FC<TaskSwitcherProps> = ({
  currentTaskId,
  onSelectTask,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", "mine"],
    queryFn: () => workspaceApi.getMyTasks(),
  });

  const tasks = data?.items || [];

  const handleSelect = (nextId: string) => {
    setTaskId(nextId);
    onSelectTask(nextId);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "in_review":
        return "In Review";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="h-9 w-48 rounded-lg bg-raised animate-pulse border border-line" />
    );
  }

  const taskOptions: SelectOption[] = tasks.map((task) => ({
    value: task.id,
    label: `${task.title} (${getStatusLabel(task.status)})`,
  }));

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="task-switcher" className="sr-only">
        Active task
      </label>
      <Select
        id="task-switcher"
        size="sm"
        value={currentTaskId || (tasks[0]?.id ?? "")}
        onChange={handleSelect}
        options={taskOptions}
        aria-label="Active task"
        className="max-w-[260px] truncate"
      />
    </div>
  );
};

