import { Router } from 'express';
import { createUser, getAllUsers, getUserById } from '../dal/users.js';

const router = Router();

router.get('/', async (_req, res) => {
	const users = await getAllUsers();
	res.json(users);
});

router.get('/:id', async (req, res) => {
	const user = await getUserById(Number(req.params.id));
	if (!user) {
		res.status(404).json({ error: 'User not found' });
		return;
	}

	res.json(user);
});

router.post('/', async (req, res) => {
	const user = await createUser({
		name: req.body.name,
		email: req.body.email,
	});
	res.status(201).json(user);
});

export default router;
