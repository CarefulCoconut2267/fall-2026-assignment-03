import { Router } from 'express';
import {
	createTicket,
	getAllTickets,
	getTicketById,
	updateTicketStatus,
} from '../dal/tickets.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const ticketStatuses = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

// Express input must be a plain object shape, not null, an array, or a primitive.
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Avoid Number() coercions such as accepting whitespace, decimals, or unsafe IDs.
function parsePositiveInteger(value: unknown): number | undefined {
	if (typeof value !== 'string' || !/^\d+$/.test(value)) {
		return undefined;
	}

	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

// Pagination offsets may be zero, while still requiring a decimal safe integer.
function parseNonNegativeInteger(value: unknown): number | undefined {
	if (typeof value !== 'string' || !/^\d+$/.test(value)) {
		return undefined;
	}

	const parsed = Number(value);
	return Number.isSafeInteger(parsed) ? parsed : undefined;
}

// Use the same status allowlist for filters and status updates.
function isTicketStatus(value: unknown): value is (typeof ticketStatuses)[number] {
	return typeof value === 'string' && ticketStatuses.includes(value as (typeof ticketStatuses)[number]);
}

// List tickets with optional pagination and status filtering; reject unknown query keys.
router.get('/', async (req, res) => {
	const query = req.query;
	const allowedQueryKeys = new Set(['limit', 'offset', 'status']);

	if (Object.keys(query).some((key) => !allowedQueryKeys.has(key))) {
		res.status(400).json({ error: 'Invalid query parameters' });
		return;
	}

	let limit: number | undefined;
	let offset: number | undefined;
	if (query.limit !== undefined) {
		limit = parseNonNegativeInteger(query.limit);
		if (limit === undefined || limit === 0) {
			res.status(400).json({ error: 'limit must be a positive integer' });
			return;
		}
	}
	if (query.offset !== undefined) {
		offset = parseNonNegativeInteger(query.offset);
		if (offset === undefined) {
			res.status(400).json({ error: 'offset must be a non-negative integer' });
			return;
		}
	}
	if (query.status !== undefined && !isTicketStatus(query.status)) {
		res.status(400).json({ error: 'Invalid ticket status' });
		return;
	}

	const tickets = await getAllTickets({
		limit,
		offset,
		status: query.status as (typeof ticketStatuses)[number] | undefined,
	});
	res.json(tickets);
});

// Return 400 for malformed IDs and 404 when a valid ID has no matching ticket.
router.get('/:id', async (req, res) => {
	const id = parsePositiveInteger(req.params.id);
	if (id === undefined) {
		res.status(400).json({ error: 'Invalid ticket id' });
		return;
	}

	const ticket = await getTicketById(id);
	if (!ticket) {
		res.status(404).json({ error: 'Ticket not found' });
		return;
	}

	res.json(ticket);
});

// Auth validates X-User-Id and places its numeric value in res.locals.userId.
// The body accepts only a non-empty title and an optional string or null description.
router.post('/', authMiddleware, async (req, res) => {
	if (
		!isRecord(req.body) ||
		Object.keys(req.body).some((key) => !['title', 'description'].includes(key)) ||
		typeof req.body.title !== 'string' ||
		req.body.title.trim().length === 0 ||
		req.body.title.length > 255 ||
		(req.body.description !== undefined &&
			req.body.description !== null &&
			typeof req.body.description !== 'string')
	) {
		res.status(400).json({ error: 'Invalid ticket payload' });
		return;
	}

	const ticket = await createTicket({
		title: req.body.title,
		description: req.body.description ?? null,
		creator_id: res.locals.userId,
	});
	res.status(201).json(ticket);
});

// Status updates require an authenticated request containing exactly { status }.
router.patch('/:id/status', authMiddleware, async (req, res) => {
	const id = parsePositiveInteger(req.params.id);
	if (id === undefined) {
		res.status(400).json({ error: 'Invalid ticket id' });
		return;
	}
	if (
		!isRecord(req.body) ||
		Object.keys(req.body).length !== 1 ||
		!Object.hasOwn(req.body, 'status') ||
		!isTicketStatus(req.body.status)
	) {
		res.status(400).json({ error: 'Invalid ticket status payload' });
		return;
	}

	const ticket = await updateTicketStatus(id, req.body.status);
	if (!ticket) {
		res.status(404).json({ error: 'Ticket not found' });
		return;
	}

	res.json(ticket);
});

// TODO: Student implementation - Part 2: Time Log Routes
// POST /tickets/:id/time
// GET /tickets/:id/time

export default router;
