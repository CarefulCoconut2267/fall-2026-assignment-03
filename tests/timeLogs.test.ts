import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 2: Time Logs Tests', () => {
  it('authenticates log creation and returns aggregated ticket hours', async () => {
    const unauthorized = await request(app)
      .post('/tickets/1/time')
      .send({ hours: 2 });
    expect(unauthorized.status).toBe(401);

    const user = await request(app)
      .post('/users')
      .send({ name: 'Linus Torvalds', email: 'linus@example.com' });
    const ticket = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(user.body.id))
      .send({ title: 'Track implementation time' });

    const initialTotal = await request(app).get(
      `/tickets/${ticket.body.id}/time`,
    );
    expect(initialTotal.status).toBe(200);
    expect(initialTotal.body).toEqual({
      ticket_id: ticket.body.id,
      total_hours: 0,
    });

    const firstHours = 3;
    const firstLog = await request(app)
      .post(`/tickets/${ticket.body.id}/time`)
      .set('X-User-Id', String(user.body.id))
      .send({ hours: firstHours });
    expect(firstLog.status).toBe(201);
    expect(firstLog.body).toMatchObject({
      ticket_id: ticket.body.id,
      user_id: user.body.id,
      hours: firstHours,
    });

    const secondHours = 2;
    const secondLog = await request(app)
      .post(`/tickets/${ticket.body.id}/time`)
      .set('X-User-Id', String(user.body.id))
      .send({ hours: secondHours });
    expect(secondLog.status).toBe(201);

    const total = await request(app).get(`/tickets/${ticket.body.id}/time`);
    expect(total.status).toBe(200);
    expect(total.body).toEqual({
      ticket_id: ticket.body.id,
      total_hours: firstHours + secondHours,
    });
  });
});
