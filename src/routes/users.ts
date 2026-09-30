import { Router } from 'express';
import { createUser, getAllUsers, getUserById } from '../dal/users.js';

const router = Router();

// Returns all users in the system using GET /users
router.get('/', async (_req, res) => {
	const users = await getAllUsers();
	res.json(users);
});

// Returns a specific user in the system using GET /users/:id
router.get('/:id', async (req, res) => {
	const user = await getUserById(Number(req.params.id));
	if (!user) {
		res.status(404).json({ error: 'User not found' });
		return;
	}

	res.json(user);
});


// Creates a new user using POST /users
router.post('/', async (req, res) => {
	const user = await createUser({
		name: req.body.name,
		email: req.body.email,
	});
	res.status(201).json(user);
});

export default router;
