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
});
