import { http } from '@/src/lib/http';

export type User = {
  _id: string;
  role: 'admin' | 'customer';
  fullName: string;
  email: string;
  phone?: string;
  isOtpVerified: boolean;
  createdAt: string;
};

export async function getAdminUsers(params?: { page?: number; limit?: number }) {
  const res = await http.get('/admin/users', { params });
  return res.data as { page: number; limit: number; total: number; items: User[] };
}
