import { http, HttpResponse } from 'msw';
import { Priority } from '@prisma/client';

// Mock data
export const mockCategories = [
  {
    id: 'cat-1',
    name: 'Work',
    color: '#ef4444',
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    _count: { todos: 3 },
  },
  {
    id: 'cat-2',
    name: 'Personal',
    color: '#3b82f6',
    userId: 'user-1',
    createdAt: new Date('2024-01-02'),
    _count: { todos: 2 },
  },
];

export const mockTodos = [
  {
    id: 'todo-1',
    title: 'Complete project',
    description: 'Finish the todo app',
    completed: false,
    priority: Priority.HIGH,
    dueDate: '2024-12-31T00:00:00.000Z',
    categoryId: 'cat-1',
    category: mockCategories[0],
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'todo-2',
    title: 'Buy groceries',
    description: null,
    completed: true,
    priority: Priority.MEDIUM,
    dueDate: null,
    categoryId: 'cat-2',
    category: mockCategories[1],
    userId: 'user-1',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'todo-3',
    title: 'Read a book',
    description: 'Start with chapter 1',
    completed: false,
    priority: Priority.LOW,
    dueDate: '2024-01-15T00:00:00.000Z',
    categoryId: null,
    category: null,
    userId: 'user-1',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

export const handlers = [
  // GET /api/todos
  http.get('/api/todos', () => {
    return HttpResponse.json(mockTodos);
  }),

  // POST /api/todos
  http.post('/api/todos', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newTodo = {
      id: `todo-${Date.now()}`,
      title: body.title,
      description: body.description || null,
      completed: false,
      priority: body.priority || Priority.MEDIUM,
      dueDate: body.dueDate || null,
      categoryId: body.categoryId || null,
      category: null,
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return HttpResponse.json(newTodo, { status: 201 });
  }),

  // PATCH /api/todos/:id
  http.patch('/api/todos/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Record<string, unknown>;
    const todo = mockTodos.find((t) => t.id === id);
    if (!todo) {
      return HttpResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    const updatedTodo = { ...todo, ...body, updatedAt: new Date() };
    return HttpResponse.json(updatedTodo);
  }),

  // DELETE /api/todos/:id
  http.delete('/api/todos/:id', ({ params }) => {
    const { id } = params;
    const todo = mockTodos.find((t) => t.id === id);
    if (!todo) {
      return HttpResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, message: 'Todo deleted successfully' });
  }),

  // GET /api/categories
  http.get('/api/categories', () => {
    return HttpResponse.json(mockCategories);
  }),

  // POST /api/categories
  http.post('/api/categories', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newCategory = {
      id: `cat-${Date.now()}`,
      name: body.name,
      color: body.color || '#6b7280',
      userId: 'user-1',
      createdAt: new Date(),
      _count: { todos: 0 },
    };
    return HttpResponse.json(newCategory, { status: 201 });
  }),

  // DELETE /api/categories/:id
  http.delete('/api/categories/:id', ({ params }) => {
    const { id } = params;
    const category = mockCategories.find((c) => c.id === id);
    if (!category) {
      return HttpResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, message: 'Category deleted successfully' });
  }),

  // PATCH /api/user/theme
  http.patch('/api/user/theme', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ theme: body.theme });
  }),
];
