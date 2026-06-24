const { createCourse, listCoursesByOwner, getCourseById, updateCourseById, deleteCourseById,
  createLesson, listLessonsByCourse, getLessonById, updateLessonById, deleteLessonById } = require('../services/firebase.service');

async function listCourses(req, res) {
  try {
    const courses = await listCoursesByOwner(req.userId);
    res.json({ courses });
  } catch (error) {
    console.error('listCourses error:', error);
    res.status(500).json({ error: 'Error fetching courses' });
  }
}

async function createCourseHandler(req, res) {
  try {
    const payload = req.body;
    if (!payload.title) return res.status(400).json({ error: 'Course title required' });
    const course = await createCourse({
      ownerId: req.userId,
      title: payload.title,
      description: payload.description || null,
      image: payload.image || null,
      status: payload.status || 'draft',
      createdBy: req.userId
    });
    res.status(201).json({ course });
  } catch (error) {
    console.error('createCourse error:', error);
    res.status(500).json({ error: 'Error creating course' });
  }
}

async function getCourseHandler(req, res) {
  try {
    const { courseId } = req.params;
    const course = await getCourseById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const lessons = await listLessonsByCourse(courseId);
    res.json({ course, lessons });
  } catch (error) {
    console.error('getCourse error:', error);
    res.status(500).json({ error: 'Error fetching course' });
  }
}

async function updateCourseHandler(req, res) {
  try {
    const { courseId } = req.params;
    const payload = req.body;
    const course = await updateCourseById(courseId, {
      title: payload.title,
      description: payload.description,
      image: payload.image,
      status: payload.status
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ course });
  } catch (error) {
    console.error('updateCourse error:', error);
    res.status(500).json({ error: 'Error updating course' });
  }
}

async function deleteCourseHandler(req, res) {
  try {
    const { courseId } = req.params;
    await deleteCourseById(courseId);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('deleteCourse error:', error);
    res.status(500).json({ error: 'Error deleting course' });
  }
}

async function createLessonHandler(req, res) {
  try {
    const { courseId } = req.params;
    const payload = req.body;
    if (!payload.title) return res.status(400).json({ error: 'Lesson title required' });
    const lesson = await createLesson({
      courseId,
      title: payload.title,
      content: payload.content || null,
      videoUrl: payload.videoUrl || null,
      order: payload.order || 0,
      duration: payload.duration || null
    });
    res.status(201).json({ lesson });
  } catch (error) {
    console.error('createLesson error:', error);
    res.status(500).json({ error: 'Error creating lesson' });
  }
}

async function updateLessonHandler(req, res) {
  try {
    const { lessonId } = req.params;
    const payload = req.body;
    const lesson = await updateLessonById(lessonId, {
      title: payload.title,
      content: payload.content,
      videoUrl: payload.videoUrl,
      order: payload.order,
      duration: payload.duration
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ lesson });
  } catch (error) {
    console.error('updateLesson error:', error);
    res.status(500).json({ error: 'Error updating lesson' });
  }
}

async function deleteLessonHandler(req, res) {
  try {
    const { lessonId } = req.params;
    await deleteLessonById(lessonId);
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    console.error('deleteLesson error:', error);
    res.status(500).json({ error: 'Error deleting lesson' });
  }
}

async function listLessonsHandler(req, res) {
  try {
    const { courseId } = req.params;
    const lessons = await listLessonsByCourse(courseId);
    res.json({ lessons });
  } catch (error) {
    console.error('listLessons error:', error);
    res.status(500).json({ error: 'Error fetching lessons' });
  }
}

module.exports = {
  listCourses, createCourseHandler, getCourseHandler, updateCourseHandler, deleteCourseHandler,
  createLessonHandler, updateLessonHandler, deleteLessonHandler, listLessonsHandler
};
