import { http } from '../../lib/http';
import { TasksResponse } from './types';

export const workspaceApi = {
  getTasksMine: () => http.get<TasksResponse>('/tasks/mine'),
};

