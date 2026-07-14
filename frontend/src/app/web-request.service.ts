import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebRequestService {

  readonly ROOT_URL;

  constructor(private http: HttpClient) {
    this.ROOT_URL = environment.apiUrl;
  }

  get(uri: string) {
    return this.http.get(`${this.ROOT_URL}/${uri}`);
  }

  post(uri: string, payload: Object) {
    return this.http.post(`${this.ROOT_URL}/${uri}`, payload);
  }

  patch(uri: string, payload: Object) {
    return this.http.patch(`${this.ROOT_URL}/${uri}`, payload);
  }

  delete(uri: string) {
    return this.http.delete(`${this.ROOT_URL}/${uri}`);
  }

  login(email: string, password: string) {
    return this.http.post(`${this.ROOT_URL}/users/login`, {
      email,
      password
    }, {
        observe: 'response'
      });
  }

  signup(username: string, email: string, password: string) {
    return this.http.post(`${this.ROOT_URL}/users`, {
      username,
      email,
      password
    }, {
        observe: 'response'
      });
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.ROOT_URL}/users/forgot-password`, {
      email
    });
  }

  resetPassword(email: string, resetToken: string, newPassword: string) {
    return this.http.post(`${this.ROOT_URL}/users/reset-password`, {
      email,
      resetToken,
      newPassword
    });
  }


}
