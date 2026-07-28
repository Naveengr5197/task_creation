import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/task.service';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {

  users: any[] = [];
  isLoading: boolean = true;
  updatingUserId: string = null;
  togglingUserId: string = null;
  userName: string = '';
  isManager: boolean = false;
  isAdmin: boolean = false;
  userRole: string = '';
  successMessage: string = '';
  searchQuery: string = '';
  roleFilter: string = 'all';
  statusFilterValue: string = 'all';

  get filteredUsers(): any[] {
    return this.users.filter(u => {
      const matchesSearch = !this.searchQuery ||
        (u.username || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesRole = this.roleFilter === 'all' || (u.role || 'member') === this.roleFilter;
      const matchesStatus = this.statusFilterValue === 'all' ||
        (this.statusFilterValue === 'active' && u.isActive !== false) ||
        (this.statusFilterValue === 'inactive' && u.isActive === false);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  get memberCount(): number {
    return this.users.filter(u => !u.role || u.role === 'member').length;
  }

  get managerCount(): number {
    return this.users.filter(u => u.role === 'manager').length;
  }

  get adminCount(): number {
    return this.users.filter(u => u.role === 'admin').length;
  }

  constructor(private taskService: TaskService, private authService: AuthService) {}

  ngOnInit() {
    this.userName = this.authService.getUserName() || 'User';
    this.isManager = this.authService.isManager();
    this.isAdmin = this.authService.isAdmin();
    this.userRole = this.authService.getUserRole();
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.taskService.getAllUsers().subscribe((users: any[]) => {
      this.users = users;
      this.isLoading = false;
    });
  }

  onRoleChange(userId: string, newRole: string) {
    this.successMessage = '';
    this.updatingUserId = userId;
    this.taskService.updateUserRole(userId, newRole).subscribe((updatedUser: any) => {
      const idx = this.users.findIndex(u => u._id === userId);
      if (idx >= 0) {
        this.users[idx] = updatedUser;
      }
      this.updatingUserId = null;
      this.successMessage = `Role updated to "${newRole}" successfully.`;
      setTimeout(() => this.successMessage = '', 3000);
    }, () => {
      this.updatingUserId = null;
    });
  }

  onLogoutClick() {
    this.authService.logout();
  }

  onToggleStatus(user: any) {
    const newStatus = user.isActive === false ? true : false;
    this.togglingUserId = user._id;
    this.taskService.updateUserStatus(user._id, newStatus).subscribe((updatedUser: any) => {
      const idx = this.users.findIndex(u => u._id === user._id);
      if (idx >= 0) {
        this.users[idx] = updatedUser;
      }
      this.togglingUserId = null;
      this.successMessage = `User ${newStatus ? 'activated' : 'deactivated'} successfully.`;
      setTimeout(() => this.successMessage = '', 3000);
    }, () => {
      this.togglingUserId = null;
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'is-danger';
      case 'manager': return 'is-warning';
      default: return 'is-info';
    }
  }
}
