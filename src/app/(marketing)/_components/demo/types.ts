export type DemoPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DemoCategory {
  id: string;
  name: string;
  color: string;
}

export interface DemoTodo {
  id: string;
  title: string;
  completed: boolean;
  priority: DemoPriority;
  dueDate: string | null;
  category: DemoCategory | null;
}
