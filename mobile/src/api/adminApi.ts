import { http } from '@/src/lib/http';

export type AdminStats = {
  users: {
    total: number;
    customers: number;
    admins: number;
    otpVerified: number;
  };
  accounts: {
    total: number;
    totalBalanceMinor: number;
  };
  loans: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  transactions: {
    total: number;
    last24hCount: number;
    last24hVolumeMinor: number;
  };
};

export async function getAdminStats() {
  const res = await http.get('/admin/stats');
  return res.data as AdminStats;
}
