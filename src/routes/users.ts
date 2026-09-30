import { Router } from 'express';
import { createUser, getAllUsers, getUserById } from '../dal/users.js';

const router = Router();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePositiveInteger(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

// Returns all users in the system using GET /users
router.get('/', async (_req, res) => {
  const users = await getAllUsers();
  res.json(users);
});

// Returns a specific user in the system using GET /users/:id
router.get('/:id', async (req, res) => {
  const id = parsePositiveInteger(req.params.id);
  if (id === undefined) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const user = await getUserById(id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(user);
});

// Creates a new user using POST /users
router.post('/', async (req, res) => {
  if (
    !isRecord(req.body) ||
    Object.keys(req.body).length !== 2 ||
    !Object.hasOwn(req.body, 'name') ||
    !Object.hasOwn(req.body, 'email') ||
    typeof req.body.name !== 'string' ||
    req.body.name.trim().length === 0 ||
    req.body.name.length > 255 ||
    typeof req.body.email !== 'string' ||
    req.body.email.trim().length === 0 ||
    req.body.email.length > 255
  ) {
    res.status(400).json({ error: 'Invalid user payload' });
    return;
  }

  const user = await createUser({
    name: req.body.name,
    email: req.body.email,
  });
  res.status(201).json(user);
});

export default router;
