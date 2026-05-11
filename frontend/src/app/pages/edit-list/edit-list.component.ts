import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from 'src/app/task.service';
import { List } from 'src/app/models/list.model';

@Component({
  selector: 'app-edit-list',
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.scss']
})
export class EditListComponent implements OnInit {

  constructor(private route: ActivatedRoute, private taskService: TaskService, private router: Router) { }

  listId: string;
  listTitle: string;
  isLoading: boolean = false;
  isLoadingData: boolean = true;

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.listId = params.listId;
        this.loadListData();
      }
    )
  }

  loadListData() {
    this.isLoadingData = true;
    this.taskService.getLists().subscribe((lists: List[]) => {
      const list = lists.find(l => l._id === this.listId);
      if (list) {
        this.listTitle = list.title;
      }
      this.isLoadingData = false;
    });
  }

  updateList(title: string) {
    this.isLoading = true;
    this.taskService.updateList(this.listId, title).subscribe(() => {
      this.isLoading = false;
      this.router.navigate(['/lists', this.listId]);
    }, (err) => {
      this.isLoading = false;
    });
  }

}
