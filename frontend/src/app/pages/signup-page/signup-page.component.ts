import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { AuthService } from 'src/app/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss']
})
export class SignupPageComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) { }

  isLoading: boolean = false;

  ngOnInit() {
  }

  onSignupButtonClicked(username: string, email: string, password: string) {
    this.isLoading = true;
    this.authService.signup(username, email, password).subscribe((res: HttpResponse<any>) => {
      this.isLoading = false;
      this.router.navigate(['/lists']);
    }, (err) => {
      this.isLoading = false;
    });
  }

}
