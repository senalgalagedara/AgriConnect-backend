import { Router } from 'express';
import UserController from '../controllers/UserController';

const router = Router();

// POST /api/users - Create new user
router.post('/', UserController.createUser);

// GET /api/users - Get all users
router.get('/', UserController.getAllUsers);

// GET /api/users/stats - Get user statistics
router.get('/stats', UserController.getUserStats);

// GET /api/users/:id - Get user by ID
router.get('/:id', UserController.getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', UserController.updateUser);

// PATCH /api/users/:id - Partial update user
router.patch('/:id', UserController.updateUser);

// DELETE /api/users/:id - Delete user (hard delete)
router.delete('/:id', UserController.deleteUser);

// POST /api/users/:id/deactivate - Soft delete (deactivate) user
router.post('/:id/deactivate', UserController.softDeleteUser);

export default router;
