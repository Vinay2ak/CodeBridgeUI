import { http } from '../../lib/http';
import { TasksResponse } from './types';
import { adaptTasksResponse } from './adapters';

export const workspaceApi = {
  getTasksMine: async (): Promise<TasksResponse> => {
    const raw = await http.get<any>('/api/v1/tasks/mine');
    return adaptTasksResponse(raw);
  },
};
