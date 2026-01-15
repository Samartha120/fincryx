import { http } from '@/src/lib/http';

export async function registerPushToken(token: string) {
  await http.post('/user/push-token', { token });
}
