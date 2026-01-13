import request from 'supertest';

import { createApp } from '../src/app';

describe('health', () => {
  it('GET /health returns ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, name: 'Finoryx API' });
  });
});
