import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminRegBootstrap,
  AdminReg,
  AdminRegResponse,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminAccount,
  AdminLogoutResponse,
  // AdminLogoutRequest,
  // AdminLogoutResponse
} from '../../../app-model/model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  private baseUrl = environment.BASE_URL;

  private loggedInSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('access_token'));

  isLoggedIn$ = this.loggedInSubject.asObservable();

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  registerAdmin(admin: AdminRegBootstrap): Observable<AdminRegResponse> {
    const url = `${this.baseUrl}/auth/admin/bootstrap`;
    return this.http.post<AdminRegResponse>(url, admin);
  }

  createAdmin(admin: AdminReg): Observable<AdminRegResponse> {
    const url = `${this.baseUrl}/auth/admin/register`;
    return this.http.post<AdminRegResponse>(url, admin);
  }

  loginAdmin(admin: AdminLoginRequest): Observable<AdminLoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const url = `${this.baseUrl}/auth/admin/login`;
    return this.http.post<AdminLoginResponse>(url, admin, { headers });
  }

  saveSession(res: AdminLoginResponse, email: string): void {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('refresh_token', res.refresh_token);
    // The login response has no name, so only the email is kept for now
    localStorage.setItem('admin_user', JSON.stringify({ email }));
    this.loggedInSubject.next(true);
  }

  getAdminAccount(): Observable<AdminAccount> {
    const url = `${this.baseUrl}/auth/admin/me`;
    return this.http.get<AdminAccount>(url);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    this.loggedInSubject.next(false);
  }

  logoutAdmin(admin: AdminLoginRequest): Observable<AdminLogoutResponse> {
    const refreshToken = localStorage.getItem('refresh_token');

    const clearLocalSession = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('admin_user');
      this.loggedInSubject.next(false);
    };

    if (!refreshToken) {
      clearLocalSession();
      return of<AdminLogoutResponse>({ status: 'success', messgae: 'Logged out locally' });
    }

    const url = `${this.baseUrl}/auth/admin/logout`;
    return this.http
      .post<AdminLogoutResponse>(url, { ...admin, refresh_token: refreshToken })
      .pipe(finalize(clearLocalSession));
  }
}
