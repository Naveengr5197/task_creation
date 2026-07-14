import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  step: number = 1; // 1 = enter email, 2 = enter code + new password
  isSendingEmail: boolean = false;
  isResetting: boolean = false;
  showNewPassword: boolean = false;

  email: string = '';
  infoMessage: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    // Support prefilled values from email link
    this.route.queryParamMap.subscribe((params) => {
      const emailParam = params.get('email');
      const tokenParam = params.get('token');
      if (emailParam && tokenParam) {
        this.email = emailParam;
        this.step = 2;
      }
    });
  }

  onSendResetEmail(email: string) {
    this.clearMessages();

    if (!email) {
      this.errorMessage = 'Please enter your email.';
      return;
    }

    this.isSendingEmail = true;
    this.email = email;
    this.authService.forgotPassword(email).subscribe((res: any) => {
      this.isSendingEmail = false;
      this.infoMessage = res?.message || 'Reset code sent! Check your inbox.';
      this.step = 2;
    }, (err) => {
      this.isSendingEmail = false;
      this.errorMessage = err?.error?.message || 'Failed to send reset email. Please try again.';
    });
  }

  onResetPassword(resetToken: string, newPassword: string, confirmPassword: string) {
    this.clearMessages();

    if (!resetToken || !newPassword || !confirmPassword) {
      this.errorMessage = 'Please fill all fields.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isResetting = true;
    this.authService.resetPassword(this.email, resetToken, newPassword).subscribe((res: any) => {
      this.isResetting = false;
      this.infoMessage = res?.message || 'Password reset successful!';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }, (err) => {
      this.isResetting = false;
      this.errorMessage = err?.error?.message || 'Invalid or expired reset code.';
    });
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  private clearMessages() {
    this.infoMessage = '';
    this.errorMessage = '';
  }
}
