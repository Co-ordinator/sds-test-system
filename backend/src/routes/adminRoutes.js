const express = require('express');
const router = express.Router();
const { authorize, preventSelfDeletion } = require('../middleware/authorize');
const { verifyToken } = require('../middleware/auth');
const UserController = require('../controllers/userController');
const AdminController = require('../controllers/adminController');

// All admin routes require admin role
router.use(verifyToken, authorize(['admin']));

// User management
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUser);
router.delete('/users/:id', preventSelfDeletion, AdminController.deleteUser);

// Analytics
router.get('/analytics', AdminController.getAnalytics);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/audit-logs/:id', AdminController.getAuditLog);

module.exports = router;
