const express = require('express');
const router = express.Router();
const { authenticateFirebase, loadUserInfo } = require('../middlewares/auth.middleware');
const academy = require('../controllers/academy.controller');

router.use(authenticateFirebase);
router.use(loadUserInfo);

router.get('/courses', academy.listCourses);
router.post('/courses', academy.createCourseHandler);
router.get('/courses/:courseId', academy.getCourseHandler);
router.put('/courses/:courseId', academy.updateCourseHandler);
router.delete('/courses/:courseId', academy.deleteCourseHandler);

router.get('/courses/:courseId/lessons', academy.listLessonsHandler);
router.post('/courses/:courseId/lessons', academy.createLessonHandler);
router.put('/lessons/:lessonId', academy.updateLessonHandler);
router.delete('/lessons/:lessonId', academy.deleteLessonHandler);

module.exports = router;
