import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 1: API Integration Tests', () => {
  it('supports listing, creating, and fetching users', async () => {
    const initialUsers = await request(app).get('/users');
    expect(initialUsers.status).toBe(200);
    expect(initialUsers.body).toEqual([]);

    const createdUser = await request(app)
      .post('/users')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com' });

    expect(createdUser.status).toBe(201);
    expect(createdUser.body).toMatchObject({
      id: expect.any(Number),
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });

    const users = await request(app).get('/users');
    expect(users.status).toBe(200);
    expect(users.body).toHaveLength(1);

    const fetchedUser = await request(app).get(`/users/${createdUser.body.id}`);
    expect(fetchedUser.status).toBe(200);
    expect(fetchedUser.body).toEqual(createdUser.body);

    const missingUser = await request(app).get('/users/999999');
    expect(missingUser.status).toBe(404);
  });

  it('supports creating, listing, filtering, fetching, and updating tickets', async () => {
    const createdUser = await request(app)
      .post('/users')
      .send({ name: 'Grace Hopper', email: 'grace@example.com' });
    const creatorId = createdUser.body.id;

    const createdTicket = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(creatorId))
      .send({ title: 'Add ticket API', description: 'Implement routes' });

    expect(createdTicket.status).toBe(201);
    expect(createdTicket.body).toMatchObject({
      title: 'Add ticket API',
      description: 'Implement routes',
      status: 'TODO',
      creator_id: creatorId,
    });

    const list = await request(app).get('/tickets?limit=1&offset=0&status=TODO');
    expect(list.status).toBe(200);
    expect(list.body).toEqual([createdTicket.body]);

    const fetched = await request(app).get(`/tickets/${createdTicket.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(createdTicket.body);

    const updated = await request(app)
      .patch(`/tickets/${createdTicket.body.id}/status`)
      .set('X-User-Id', String(creatorId))
      .send({ status: 'IN_PROGRESS' });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('IN_PROGRESS');

    const missingTicket = await request(app).get('/tickets/999999');
    expect(missingTicket.status).toBe(404);
  });

  it('rejects unauthenticated and malformed ticket writes and queries', async () => {
    const unauthorized = await request(app)
      .post('/tickets')
      .send({ title: 'No creator' });
    expect(unauthorized.status).toBe(401);

    const createdUser = await request(app)
      .post('/users')
      .send({ name: 'Katherine Johnson', email: 'katherine@example.com' });
    const invalidPayload = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(createdUser.body.id))
      .send({ title: 'Valid title', extra: true });
    expect(invalidPayload.status).toBe(400);

    const invalidQuery = await request(app).get('/tickets?limit=2.5');
    expect(invalidQuery.status).toBe(400);
  });
});
