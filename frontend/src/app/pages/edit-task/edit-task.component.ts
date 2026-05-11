import { Component, OnInit } from '@angular/core';
import { Params, ActivatedRoute, Router } from '@angular/router';
import { TaskService } from 'src/app/task.service';

@Component({
  selector: 'app-edit-task',
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss']
})
export class EditTaskComponent implements OnInit {

  constructor(private route: ActivatedRoute, private taskService: TaskService, private router: Router) { }

  taskId: string;
  listId: string;


  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.taskId = params.taskId;
        this.listId = params.listId;
        console.log('param', params);
      }
    )
    this.getTask();
  }

  getTask(){
      this.taskService.getTaskById(this.listId, this.taskId).subscribe((task) => {
        console.log('task', task);
      })
  }

  updateTask(title: string, amount: number) {
    this.taskService.updateTask(this.listId, this.taskId, title, amount).subscribe(() => {
      this.router.navigate(['/lists', this.listId]);
    })
  }

  onCancelClicked(){
    this.router.navigate(['lists/' + this.listId])

  }

}
