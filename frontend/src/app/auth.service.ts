import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { WebRequestService } from './web-request.service';
import { Router } from '@angular/router';
import { shareReplay, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private webService: WebRequestService, private router: Router, private http: HttpClient) { }

  login(email: string, password: string) {
    return this.webService.login(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        this.setSession(res.body._id, res.body.username || email, res.headers.get('x-access-token'), res.headers.get('x-refresh-token'), res.body.role || 'member');
        console.log("LOGGED IN!");
      })
    )
  }


  signup(username: string, email: string, password: string) {
    return this.webService.signup(username,email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        this.setSession(res.body._id, username, res.headers.get('x-access-token'), res.headers.get('x-refresh-token'), res.body.role || 'member');
        console.log("Successfully signed up and now logged in!");
      })
    )
  }

  forgotPassword(email: string) {
    return this.webService.forgotPassword(email);
  }

  resetPassword(email: string, resetToken: string, newPassword: string) {
    return this.webService.resetPassword(email, resetToken, newPassword);
  }



  logout() {
    console.log('logiut');
    this.removeSession();
    this.router.navigate(['/login']);
  }

  getAccessToken() {
    return localStorage.getItem('x-access-token');
  }

  getRefreshToken() {
    return localStorage.getItem('x-refresh-token');
  }

  getUserId() {
    return localStorage.getItem('user-id');
  }

  getUserName() {
    return localStorage.getItem('user-name');
  }

  getUserRole() {
    return localStorage.getItem('user-role') || 'member';
  }

  isManager() {
    const role = this.getUserRole();
    return role === 'manager' || role === 'admin';
  }

  isAdmin() {
    return this.getUserRole() === 'admin';
  }

  setAccessToken(accessToken: string) {
    localStorage.setItem('x-access-token', accessToken)
  }

  private setSession(userId: string, username: string, accessToken: string, refreshToken: string, role: string = 'member') {
    localStorage.setItem('user-id', userId);
    localStorage.setItem('user-name', username);
    localStorage.setItem('x-access-token', accessToken);
    localStorage.setItem('x-refresh-token', refreshToken);
    localStorage.setItem('user-role', role);
  }

  private removeSession() {
    localStorage.removeItem('user-id');
    localStorage.removeItem('user-name');
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('x-refresh-token');
    localStorage.removeItem('user-role');
  }

  getNewAccessToken() {
    return this.http.get(`${this.webService.ROOT_URL}/users/me/access-token`, {
      headers: {
        'x-refresh-token': this.getRefreshToken(),
        '_id': this.getUserId()
      },
      observe: 'response'
    }).pipe(
      tap((res: HttpResponse<any>) => {
        this.setAccessToken(res.headers.get('x-access-token'));
      })
    )
  }
}
