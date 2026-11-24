import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth-service/auth-service';
import { AdminAccount } from '../../app-model/model';

const COLLAPSED_KEY = 'admin_sidebar_collapsed';

interface NavItem {
  label: string;
  link: string;
  icon: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [NgClass, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
})
export class AdminLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  adminAccount: AdminAccount | null = null;

  readonly navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', link: '/admin/overview', icon: 'fa-chart-line' }],
    },
    {
      label: 'Manage',
      items: [
        { label: 'Events', link: '/admin/events', icon: 'fa-calendar-alt' },
        { label: 'Users', link: '/admin/users', icon: 'fa-users' },
        { label: 'Orders', link: '/admin/orders', icon: 'fa-receipt' },
      ],
    },
    {
      label: 'Finance',
      items: [{ label: 'Finance', link: '/admin/finance', icon: 'fa-wallet' }],
    },
    {
      label: 'System',
      items: [
        { label: 'Administrators', link: '/admin/admins', icon: 'fa-user-shield' },
        // { label: 'Settings', link: '/admin/settings', icon: 'fa-cog' },
      ],
    },
  ];

  mobileMenuOpen = false;
  isCollapsed = false;

  adminName = 'Administrator';
  adminEmail = '';
  adminInitials = 'A';

  constructor() {
    // Restore sidebar state
    try {
      this.isCollapsed = localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      // Storage unavailable: start expanded
    }
  }

  ngOnInit(): void {
    this.loadAdminDetails();
  }

  private loadAdminDetails(): void {
    this.authService.getAdminAccount().subscribe({
      next: (admin) => {
        this.adminAccount = admin;

        const first = admin.first_name?.trim() ?? '';
        const last = admin.last_name?.trim() ?? '';

        this.adminName = `${first} ${last}`.trim() || 'Administrator';
        this.adminEmail = admin.email ?? '';
        this.adminInitials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'A';
      },
      error: (error) => {
        console.error('Unable to retrieve admin account:', error);
      },
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;

    try {
      localStorage.setItem(COLLAPSED_KEY, this.isCollapsed ? '1' : '0');
    } catch {
      // Ignore storage errors
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
