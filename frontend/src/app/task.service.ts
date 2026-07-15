import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Task } from './models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private webReqService: WebRequestService) { }


  getLists() {
    return this.webReqService.get('lists');
  }

  createList(title: string) {
    // We want to send a web request to create a list
    return this.webReqService.post('lists', { title });
  }

  updateList(id: string, title: string) {
    // We want to send a web request to update a list
    return this.webReqService.patch(`lists/${id}`, { title });
  }

  updateTask(listId: string, taskId: string, title: string, amount: number) {
    // We want to send a web request to update a list
    return this.webReqService.patch(`lists/${listId}/tasks/${taskId}`, { title, amount });
  }

  deleteTask(listId: string, taskId: string) {
    return this.webReqService.delete(`lists/${listId}/tasks/${taskId}`);
  }

  deleteList(id: string) {
    return this.webReqService.delete(`lists/${id}`);
  }

  getTasks(listId: string) {
    return this.webReqService.get(`lists/${listId}/tasks`);
  }

  getTaskById(listId: string, taskId: string) {
    return this.webReqService.get(`lists/${listId}/tasks/${taskId}`);
  }

  createTask(title: string, amount : number, listId: string) {
    // We want to send a web request to create a task
    return this.webReqService.post(`lists/${listId}/tasks`, { title, amount });
  }

  complete(task: Task) {
    return this.webReqService.patch(`lists/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    });
  }

  // Shared Board methods
  getSharedLists() {
    return this.webReqService.get('shared/lists');
  }

  createSharedList(title: string) {
    return this.webReqService.post('shared/lists', { title });
  }

  updateSharedList(id: string, title: string) {
    return this.webReqService.patch(`shared/lists/${id}`, { title });
  }

  deleteSharedList(id: string) {
    return this.webReqService.delete(`shared/lists/${id}`);
  }

  getSharedTasks(listId: string) {
    return this.webReqService.get(`shared/lists/${listId}/tasks`);
  }

  createSharedTask(title: string, amount: number, listId: string) {
    return this.webReqService.post(`shared/lists/${listId}/tasks`, { title, amount });
  }

  updateSharedTask(listId: string, taskId: string, title: string, amount: number) {
    return this.webReqService.patch(`shared/lists/${listId}/tasks/${taskId}`, { title, amount });
  }

  deleteSharedTask(listId: string, taskId: string) {
    return this.webReqService.delete(`shared/lists/${listId}/tasks/${taskId}`);
  }

  completeSharedTask(task: Task) {
    return this.webReqService.patch(`shared/lists/${task._listId}/tasks/${task._id}`, {
      completed: !task.completed
    });
  }

  // Admin methods
  getAllUsers() {
    return this.webReqService.get('admin/users');
  }

  updateUserRole(userId: string, role: string) {
    return this.webReqService.patch(`admin/users/${userId}/role`, { role });
  }

  updateUserStatus(userId: string, isActive: boolean) {
    return this.webReqService.patch(`admin/users/${userId}/status`, { isActive });
  }

  getCurrentUser() {
    return this.webReqService.get('users/me');
  }
}
