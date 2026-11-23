export interface AdminRegBootstrap {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AdminRegResponse {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
}

export interface AdminReg {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  status: string;
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AdminLogoutRequest {
  refresh_token: string;
}

export interface AdminLogoutResponse {
  status: string;
  messgae: string;
}

export interface AdminAccount {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
}

export interface AdminDashboard {
  total_events: number;
  active_events: number;
  upcoming_events: number;
  total_tickets_sold: number;
  total_revenue: number;
}

export interface AdminFetchEvents {
  uuid: string;
  title: string;
  date: string;
  status: string;
  tickets_sold: number;
  featured: boolean;
}

export interface AdminFetchOrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  refunded_orders: number;
  free_orders: number;
}
export interface AdminFetchOrders {
  order_id: string;
  event: string;
  buyer: string;
  tickets: number;
  total: number;
  type: string;
  status: string;
  date: string;
}

export interface AdminFetchOrderId {
  order_id: string;
  event: string;
  buyer: string;
  tickets: number;
  total: number;
  type: string;
  status: string;
  date: string;
}

export interface AdminOrderIdRefund {
  order_id: string;
  event: string;
  buyer: string;
  tickets: number;
  total: number;
  type: string;
  status: string;
  date: string;
}

export interface AdminFetchFinance {
  total_revenue: number;
  available_balance: number;
  pending: number;
  total_events: number;
}

export interface AdminMakePayoutRequest {
  host_id: string;
  event_id: string;
  amount: number;
}

export interface AdminMakePayoutResponse {
  uuid: string;
  date: string;
  event: string;
  amount: number;
  status: string;
  type: string;
}

export interface AdminFetchFinancePayouts {
  uuid: string;
  date: string;
  event: string;
  amount: number;
  status: string;
  type: string;
} //Array

export interface AdminFetchUsers {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: string;
  organization: string;
  created_at: string;
}

export interface AdminFetchUsersId {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: string;
  organization: string;
  created_at: string;
}

export interface AdminUpdateUsersRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
}

export interface AdminUpdateUsersResposnse {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: string;
  organization: string;
  created_at: string;
}

export interface AdminFetchHosts {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: string;
  organization: string;
  created_at: string;
}

export interface AdminFetchHostsId {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: string;
  organization: string;
  created_at: string;
}
