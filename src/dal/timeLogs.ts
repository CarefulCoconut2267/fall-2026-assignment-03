import { db, NewTimeLog, TimeLog } from '../db/database.js';

// Inserts a time log and returns the persisted row.
export async function insertTimeLog(
  ticketId: number,
  userId: number,
  hours: number,
): Promise<TimeLog> {
  const timeLog: NewTimeLog = {
    ticket_id: ticketId,
    user_id: userId,
    hours,
  };

  return await db
    .insertInto('time_logs')
    .values(timeLog)
    .returningAll()
    .executeTakeFirstOrThrow();
}

// Returns the SQL-aggregated hours for a ticket, or zero when none are logged.
export async function getTotalHoursForTicket(
  ticketId: number,
): Promise<number> {
  const result = await db
    .selectFrom('time_logs')
    .select((expression) =>
      expression.fn.sum<number>('hours').as('total_hours'),
    )
    .where('ticket_id', '=', ticketId)
    .executeTakeFirst();

  return Number(result?.total_hours ?? 0);
}
