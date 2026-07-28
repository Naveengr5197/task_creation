import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/task.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Task } from 'src/app/models/task.model';
import { List } from 'src/app/models/list.model';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-shared-board',
  templateUrl: './shared-board.component.html',
  styleUrls: ['./shared-board.component.scss']
})
export class SharedBoardComponent implements OnInit {

  lists: List[];
  tasks: Task[];
  selectedListId: string;
  sumOfAmount: number = 0;
  viewTotal: boolean = false;
  isLoadingLists: boolean = true;
  isLoadingTasks: boolean = false;
  isDeletingList: boolean = false;
  deletingTaskId: string = null;
  isSidebarOpen: boolean = false;
  userName: string = '';
  isManager: boolean = false;
  isAdmin: boolean = false;
  userRole: string = '';

  // Inline create
  newListTitle: string = '';
  newTaskTitle: string = '';
  newTaskAmount: number = null;
  isCreatingList: boolean = false;
  isCreatingTask: boolean = false;

  // Search & filter
  searchQuery: string = '';
  statusFilter: string = 'all';

  get filteredTasks(): Task[] {
    if (!this.tasks) return [];
    return this.tasks.filter(t => {
      const matchesSearch = !this.searchQuery || t.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' ||
        (this.statusFilter === 'completed' && t.completed) ||
        (this.statusFilter === 'pending' && !t.completed);
      return matchesSearch && matchesStatus;
    });
  }

  get filteredTotal(): number {
    return this.filteredTasks.reduce((sum, t) => sum + t.amount, 0);
  }

  // Edit modal
  isEditModalOpen: boolean = false;
  editingTask: Task = null;
  editTitle: string = '';
  editAmount: number = null;
  isSavingEdit: boolean = false;

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userName = this.authService.getUserName() || 'User';
    this.isManager = this.authService.isManager();
    this.isAdmin = this.authService.isAdmin();
    this.userRole = this.authService.getUserRole();

    this.route.params.subscribe((params: Params) => {
      if (params.listId) {
        this.selectedListId = params.listId;
        this.loadTasks(params.listId);
      } else {
        this.tasks = undefined;
      }
    });

    this.taskService.getSharedLists().subscribe((lists: List[]) => {
      this.lists = lists;
      this.isLoadingLists = false;
    });
  }

  loadTasks(listId: string) {
    this.isLoadingTasks = true;
    this.taskService.getSharedTasks(listId).subscribe((tasks: Task[]) => {
      this.tasks = tasks;
      this.isLoadingTasks = false;
      this.sumOfAmount = 0;
      this.viewTotal = tasks.length > 0;
      tasks.forEach(t => this.sumOfAmount += t.amount);
    });
  }

  onCreateList() {
    if (!this.newListTitle.trim()) return;
    this.isCreatingList = true;
    this.taskService.createSharedList(this.newListTitle).subscribe((list: List) => {
      this.lists.push(list);
      this.newListTitle = '';
      this.isCreatingList = false;
    });
  }

  onDeleteList(listId: string) {
    this.isDeletingList = true;
    this.taskService.deleteSharedList(listId).subscribe(() => {
      this.lists = this.lists.filter(l => l._id !== listId);
      this.isDeletingList = false;
      if (listId === this.selectedListId) {
        this.router.navigate(['/shared-board']);
      }
    });
  }

  onCreateTask() {
    if (!this.newTaskTitle.trim() || this.newTaskAmount === null) return;
    this.isCreatingTask = true;
    this.taskService.createSharedTask(this.newTaskTitle, this.newTaskAmount, this.selectedListId).subscribe((task: Task) => {
      this.tasks.push(task);
      this.sumOfAmount += task.amount;
      this.viewTotal = true;
      this.newTaskTitle = '';
      this.newTaskAmount = null;
      this.isCreatingTask = false;
    });
  }

  onTaskClick(task: Task) {
    this.taskService.completeSharedTask(task).subscribe(() => {
      task.completed = !task.completed;
    });
  }

  onDeleteTask(taskId: string) {
    this.deletingTaskId = taskId;
    this.taskService.deleteSharedTask(this.selectedListId, taskId).subscribe(() => {
      const deleted = this.tasks.find(t => t._id === taskId);
      this.tasks = this.tasks.filter(t => t._id !== taskId);
      if (deleted) this.sumOfAmount -= deleted.amount;
      this.viewTotal = this.tasks.length > 0;
      this.deletingTaskId = null;
    });
  }

  onEditTask(task: Task) {
    this.editingTask = task;
    this.editTitle = task.title;
    this.editAmount = task.amount;
    this.isEditModalOpen = true;
  }

  onCloseEditModal() {
    this.isEditModalOpen = false;
    this.editingTask = null;
  }

  onSaveEdit() {
    if (!this.editTitle.trim() || this.editAmount === null) return;
    this.isSavingEdit = true;
    this.taskService.updateSharedTask(this.selectedListId, this.editingTask._id, this.editTitle, this.editAmount).subscribe(() => {
      this.isSavingEdit = false;
      this.isEditModalOpen = false;
      this.editingTask = null;
      this.loadTasks(this.selectedListId);
    }, () => {
      this.isSavingEdit = false;
    });
  }

  onLogoutClick() {
    this.authService.logout();
  }
}
