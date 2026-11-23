import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminDashboard,
  AdminFetchEvents,
  AdminFetchOrderStats,
  AdminFetchOrders,
  AdminFetchOrderId,
  AdminOrderIdRefund,
  AdminFetchFinance,
  AdminFetchFinancePayouts,
  AdminFetchUsers,
  AdminFetchUsersId,
  AdminUpdateUsersRequest,
  AdminUpdateUsersResposnse,
} from '../../../app-model/model';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(private http: HttpClient) {}

  private baseUrl = environment.BASE_URL;

  getDashboard(): Observable<AdminDashboard> {
    const url = `${this.baseUrl}/admin/dashboard`;
    return this.http.get<AdminDashboard>(url);
  }

  getEvents(): Observable<AdminFetchEvents[]> {
    const url = `${this.baseUrl}/admin/events`;
    return this.http.get<AdminFetchEvents[]>(url);
  }

  getOrderStats(): Observable<AdminFetchOrderStats> {
    const url = `${this.baseUrl}/admin/orders/stats`;
    return this.http.get<AdminFetchOrderStats>(url);
  }

  getOrders(order_id?: string): Observable<AdminFetchOrders[]> {
    const url = `${this.baseUrl}/admin/orders`;
    return this.http.get<AdminFetchOrders[]>(url);
  }

  getOrderById(order_id: string): Observable<AdminFetchOrderId> {
    const url = `${this.baseUrl}/admin/orders/{order_id}`;
    return this.http.get<AdminFetchOrderId>(url);
  }

  getFinance(): Observable<AdminFetchFinance> {
    const url = `${this.baseUrl}/admin/finance`;
    return this.http.get<AdminFetchFinance>(url);
  }

  getFinancePayout(): Observable<AdminFetchFinancePayouts> {
    const url = `${this.baseUrl}/admin/finance/payout`;
    return this.http.get<AdminFetchFinancePayouts>(url);
  }

  getUsers(users: AdminFetchUsersId): Observable<AdminFetchUsers> {
    const url = `${this.baseUrl}/admin/hosts`;
    return this.http.get<AdminFetchUsers>(url, { params: users as any });
  }

  getUserById(): Observable<AdminFetchUsersId> {
    const url = `${this.baseUrl}/admin/hosts/{host_id}`;
    return this.http.get<AdminFetchUsersId>(url);
  }

  updateUser(uuid: string, user: AdminUpdateUsersRequest): Observable<AdminUpdateUsersResposnse> {
    const url = `${this.baseUrl}/admin/hosts/${uuid}`;
    return this.http.patch<AdminUpdateUsersResposnse>(url, user);
  }

  // getHosts():Observable<AdminFetchHosts>{
  //   const url=`${this.baseUrl}/admin/`
  // }
}
