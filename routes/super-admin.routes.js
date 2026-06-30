const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo, requireSuperAdmin } = require('../middlewares/auth.middleware');
const superAdminController = require('../controllers/super-admin.controller');

// All super admin routes require auth + super admin role
router.use(authenticateFirebase, loadUserInfo, requireSuperAdmin);

router.get('/dashboard', superAdminController.getDashboard);
router.get('/users', superAdminController.listUsers);
router.get('/users/:uid', superAdminController.getUserDetail);
router.post('/users/set-plan', superAdminController.setUserPlan);

module.exports = router;
