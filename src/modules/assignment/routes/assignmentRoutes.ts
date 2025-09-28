import { Router } from 'express';
import { AssignmentController } from '../controllers/AssignmentController';

const router = Router();

// GET /api/assignments - Get all assignments
router.get('/', AssignmentController.getAllAssignments);

// GET /api/assignments/:id - Get assignment by ID
router.get('/:id', AssignmentController.idValidation, AssignmentController.getAssignmentById);

// POST /api/assignments - Create new assignment
router.post('/', AssignmentController.createValidation, AssignmentController.createAssignment);

// PUT /api/assignments/:id - Update assignment
router.put('/:id', AssignmentController.updateValidation, AssignmentController.updateAssignment);

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', AssignmentController.idValidation, AssignmentController.deleteAssignment);

// GET /api/assignments/driver/:driverId - Get assignments by driver ID
router.get('/driver/:driverId', AssignmentController.driverIdValidation, AssignmentController.getAssignmentsByDriverId);

// GET /api/assignments/status - Get assignments by status (query parameter)
router.get('/status', AssignmentController.statusValidation, AssignmentController.getAssignmentsByStatus);

export default router;