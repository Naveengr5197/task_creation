import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/task.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Task } from 'src/app/models/task.model';

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent implements OnInit {

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  listId: string;
  isLoading: boolean = false;

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.listId = params['listId'];
      }
    )
  }

  createTask(title: string, amount: number) {
    this.isLoading = true;
    this.taskService.createTask(title, amount, this.listId).subscribe((newTask: Task) => {
      this.isLoading = false;
      this.router.navigate(['../'], { relativeTo: this.route });
    }, (err) => {
      this.isLoading = false;
    });
  }

  onCancelClicked(){
    this.router.navigate(['lists/' + this.listId])
  }

}
