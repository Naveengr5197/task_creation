import { Component, OnInit } from '@angular/core';
import { Params, ActivatedRoute, Router } from '@angular/router';
import { TaskService } from 'src/app/task.service';
import { Task } from 'src/app/models/task.model';

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent implements OnInit {

  constructor(private route: ActivatedRoute, private taskService: TaskService, private router: Router) { }

  taskId: string;
  listId: string;
  taskTitle: string;
  taskAmount: number;
  isLoading: boolean = false;
  isLoadingData: boolean = true;

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.taskId = params.taskId;
        this.listId = params.listId;
        this.loadTaskData();
      }
    )
  }

  loadTaskData() {
    this.isLoadingData = true;
    this.taskService.getTaskById(this.listId, this.taskId).subscribe((task: Task) => {
      this.taskTitle = task.title;
      this.taskAmount = task.amount;
      this.isLoadingData = false;
    });
  }

  updateTask(title: string, amount: number) {
    this.isLoading = true;
    this.taskService.updateTask(this.listId, this.taskId, title, amount).subscribe(() => {
      this.isLoading = false;
      this.router.navigate(['/lists', this.listId]);
    }, (err) => {
      this.isLoading = false;
    });
  }

  onCancelClicked() {
    this.router.navigate(['lists/' + this.listId]);
  }

}
