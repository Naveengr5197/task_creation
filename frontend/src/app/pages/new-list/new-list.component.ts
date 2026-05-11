import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/task.service';
import { Router } from '@angular/router';
import { List } from 'src/app/models/list.model';

@Component({
  selector: 'app-new-list',
  templateUrl: './new-list.component.html',
  styleUrls: ['./new-list.component.scss']
})
export class NewListComponent implements OnInit {

  constructor(private taskService: TaskService, private router: Router) { }

  isLoading: boolean = false;

  ngOnInit() {
  }

  createList(title: string) {
    this.isLoading = true;
    this.taskService.createList(title).subscribe((list: List) => {
      this.isLoading = false;
      this.router.navigate([ '/lists', list._id ]);
    }, (err) => {
      this.isLoading = false;
    });
  }

}
