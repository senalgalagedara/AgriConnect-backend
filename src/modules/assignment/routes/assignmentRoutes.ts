import { Router } from 'express';
import { AssignmentController } from '../controllers/AssignmentController';

const router = Router();

// IMPORTANT: Register specific routes BEFORE parameterized routes like '/:id'

// GET /api/assignments - Get all assignments
router.get('/', AssignmentController.getAllAssignments);

// GET /api/assignments/status - Get assignments by status (query parameter)
// NOTE: This must come BEFORE /:id to avoid treating "status" as an id
router.get('/status', AssignmentController.statusValidation, AssignmentController.getAssignmentsByStatus);

// GET /api/assignments/driver/:driverId - Get assignments by driver ID
// NOTE: This must come BEFORE /:id to avoid treating "driver" as an id
router.get('/driver/:driverId', AssignmentController.driverIdValidation, AssignmentController.getAssignmentsByDriverId);

// POST /api/assignments - Create new assignment
router.post('/', AssignmentController.createValidation, AssignmentController.createAssignment);

// GET /api/assignments/:id - Get assignment by ID
router.get('/:id', AssignmentController.idValidation, AssignmentController.getAssignmentById);

// PUT /api/assignments/:id - Update assignment
router.put('/:id', AssignmentController.updateValidation, AssignmentController.updateAssignment);

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', AssignmentController.idValidation, AssignmentController.deleteAssignment);

export default router;