import { Component, OnInit } from "@angular/core";
import { TaskService } from "src/app/task.service";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { Task } from "src/app/models/task.model";
import { List } from "src/app/models/list.model";
import { AuthService } from "src/app/auth.service";
import * as XLSX from 'xlsx';

@Component({
  selector: "app-task-view",
  templateUrl: "./task-view.component.html",
  styleUrls: ["./task-view.component.scss"],
})
export class TaskViewComponent implements OnInit {
  title: string;
  amount: number;
  lists: List[];
  tasks: Task[];
  selectedListId: string;
  gotTasksData: Task[];
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


  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}
  //

  //
  ngOnInit() {
    this.userName = this.authService.getUserName() || 'User';
    this.isManager = this.authService.isManager();
    this.isAdmin = this.authService.isAdmin();
    this.userRole = this.authService.getUserRole();
    this.route.params.subscribe((params: Params) => {
      if (params.listId) {
        this.selectedListId = params.listId;
        this.isLoadingTasks = true;
        this.taskService.getTasks(params.listId).subscribe((tasks: Task[]) => {
          this.tasks = tasks;
          this.isLoadingTasks = false;
          this.sumOfAmount = 0;
          if (this.tasks.length == 0) {
            this.viewTotal = false;
          } else {
            this.viewTotal = true;
          }
          this.tasks.forEach((data) => {
            this.sumOfAmount = this.sumOfAmount + data.amount;
          });
        });

      } else {
        this.tasks = undefined;
      }
    });

    this.taskService.getLists().subscribe((lists: List[]) => {
      this.lists = lists;
      this.isLoadingLists = false;
    });
  }

  onTaskClick(task: Task) {
    // we want to set the task to completed
    this.taskService.complete(task).subscribe(() => {
      // the task has been set to completed successfully
      console.log("Completed successully!");
      task.completed = !task.completed;
    });
  }

  onDeleteListClick(listId?: string) {
    const id = listId || this.selectedListId;
    this.isDeletingList = true;
    this.taskService.deleteList(id).subscribe((res: any) => {
      this.lists = this.lists.filter(l => l._id !== id);
      this.isDeletingList = false;
      if (id === this.selectedListId) {
        this.router.navigate(["/lists"]);
      }
    });
  }

  onDeleteTaskClick(id: string) {
    this.deletingTaskId = id;
    this.taskService
      .deleteTask(this.selectedListId, id)
      .subscribe((res: any) => {
        this.tasks = this.tasks.filter((val) => val._id !== id);
        this.deletingTaskId = null;
        // Recalculate total amount after deletion
        this.sumOfAmount = 0;
        if (this.tasks.length === 0) {
          this.viewTotal = false;
        } else {
          this.tasks.forEach((task) => {
            this.sumOfAmount += task.amount;
          });
        }
      });
  }

  onLogoutClick() {
    console.log('Logging out...');
    this.authService.logout();
  }

  exportToCSV() {
    if (!this.tasks || this.tasks.length === 0) return;

    const headers = ['Name', 'Amount', 'Created Date', 'Updated Date'];
    const data = this.tasks.map(t => [
      t.title || '',
      t.amount,
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : ''
    ]);

    if (this.viewTotal) {
      data.push(['Total', this.sumOfAmount, '', '']);
    }

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Name
      { wch: 15 }, // Amount
      { wch: 15 }, // Created Date
      { wch: 15 }  // Updated Date
    ];

    const selectedList = this.lists && this.lists.find(l => l._id === this.selectedListId);
    const fileName = selectedList ? `${selectedList.title}.xlsx` : 'tasks.xlsx';

    XLSX.writeFile(wb, fileName);
  }
}
