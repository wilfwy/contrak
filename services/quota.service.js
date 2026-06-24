const { countUserEbooks, countUserContracts, getDb } = require('./firebase.service');
const admin = require('firebase-admin');

const QUOTAS = {
  basic: {
    ebooks: 3,
    contracts: 5,
    products: 5,
    pages: 5,
    media: 10,
    aiSuggestionsPerDay: 5,
    transcriptionsPerMonth: 5,
  },
  pro: {
    ebooks: Infinity,
    contracts: Infinity,
    products: Infinity,
    pages: Infinity,
    media: Infinity,
    aiSuggestionsPerDay: Infinity,
    transcriptionsPerMonth: Infinity,
  }
};

function getQuota(plan, feature) {
  return (QUOTAS[plan] && QUOTAS[plan][feature]) || 0;
}

async function getUsage(userId, feature) {
  switch (feature) {
    case 'ebooks':
      return countUserEbooks(userId);
    case 'contracts':
      return countUserContracts(userId);
    case 'products':
      return countCollectionForUser('products', userId, 'ownerId');
    case 'pages':
      return countCollectionForUser('pages', userId, 'ownerId');
    case 'media':
      return countCollectionForUser('media', userId, 'ownerId');
    default:
      return 0;
  }
}

async function countCollectionForUser(collection, userId, field) {
  const snapshot = await getDb().collection(collection).where(field, '==', userId).get();
  return snapshot.size;
}

async function getAiSuggestionsToday(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const snapshot = await getDb().collection('ai_usage')
    .where('userId', '==', userId)
    .where('type', '==', 'suggestion')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(today))
    .get();
  return snapshot.size;
}

async function getTranscriptionsThisMonth(userId) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const snapshot = await getDb().collection('ai_usage')
    .where('userId', '==', userId)
    .where('type', '==', 'transcription')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(firstOfMonth))
    .get();
  return snapshot.size;
}

async function getDynamicUsage(userId, feature) {
  if (feature === 'aiSuggestionsPerDay') return getAiSuggestionsToday(userId);
  if (feature === 'transcriptionsPerMonth') return getTranscriptionsThisMonth(userId);
  return getUsage(userId, feature);
}

async function checkQuota(userId, userPlan, feature) {
  const limit = getQuota(userPlan, feature);
  if (limit === Infinity) return { allowed: true, usage: 0, limit: null };
  const usage = await getDynamicUsage(userId, feature);
  return { allowed: usage < limit, usage, limit };
}

function quotaMiddleware(feature) {
  return async (req, res, next) => {
    if (req.userPlan === 'pro') return next();
    const result = await checkQuota(req.userId, req.userPlan, feature);
    if (!result.allowed) {
      return res.status(403).json({
        error: `Limite du plan BASIC atteinte pour ${feature} (${result.limit} max). Passez au PRO pour une utilisation illimitée.`,
        upgradeRequired: true,
        usage: result.usage,
        limit: result.limit
      });
    }
    req.quotaUsage = result;
    next();
  };
}

async function recordAiUsage(userId, type) {
  await getDb().collection('ai_usage').add({
    userId,
    type,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

module.exports = {
  QUOTAS,
  getQuota,
  checkQuota,
  quotaMiddleware,
  recordAiUsage,
  getAiSuggestionsToday,
  getTranscriptionsThisMonth
};
