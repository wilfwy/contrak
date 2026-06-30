const { getSiteWideStats, listAllUsers, getUser } = require('../services/firebase.service');

async function getDashboard(req, res) {
  try {
    const stats = await getSiteWideStats();
    res.json({ stats });
  } catch (error) {
    console.error('Super admin dashboard error:', error);
    res.status(500).json({ error: 'Error fetching site-wide stats' });
  }
}

async function listUsers(req, res) {
  try {
    const users = await listAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('Super admin list users error:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
}

async function getUserDetail(req, res) {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    const user = await getUser(uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error('Super admin get user error:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
}

async function setUserPlan(req, res) {
  try {
    const { uid, plan } = req.body;
    if (!uid || !plan) return res.status(400).json({ error: 'Missing uid or plan' });
    if (!['basic', 'pro'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const { updateUserPlan } = require('../services/firebase.service');
    const user = await updateUserPlan(uid, plan);
    res.json({ message: 'Plan updated', user });
  } catch (error) {
    console.error('Super admin set plan error:', error);
    res.status(500).json({ error: 'Error updating plan' });
  }
}

module.exports = { getDashboard, listUsers, getUserDetail, setUserPlan };
