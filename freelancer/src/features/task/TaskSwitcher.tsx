import React from "react";
import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "../../services/workspace/api";
import { setTaskId } from "../../lib/taskParam";

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
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

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="task-switcher" className="sr-only">
        Active task
      </label>
      <select
        id="task-switcher"
        value={currentTaskId || (tasks[0]?.id ?? "")}
        onChange={handleChange}
        className="h-9 rounded-lg border border-line-strong bg-input px-3 text-sm text-ink font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer max-w-[260px] truncate"
      >
        {tasks.map((task) => (
          <option key={task.id} value={task.id} className="bg-surface text-ink">
            {task.title} ({getStatusLabel(task.status)})
          </option>
        ))}
      </select>
    </div>
  );
};

