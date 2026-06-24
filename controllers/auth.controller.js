const { createUser, getUser, admin } = require('../services/firebase.service');
const { verifyIdToken } = require('../services/firebase.service');
const { sendPasswordResetEmail } = require('../services/email.service');

async function register(req, res) {
  try {
    const { email } = req.body;

    // Note: En production, vous devriez utiliser Firebase Admin pour créer l'utilisateur
    // ou laisser le frontend gérer la création avec Firebase Auth SDK
    // Pour l'instant, on suppose que l'utilisateur est créé côté frontend
    // et on crée juste l'entrée Firestore

    res.status(200).json({ 
      message: 'Sign up successful. Please log in.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error during registration' });
  }
}

async function login(req, res) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Missing token' });
    }

    const decodedToken = await verifyIdToken(idToken);
    
    let user = await getUser(decodedToken.uid);
    if (!user) {
      const userDoc = await createUser(decodedToken.uid, decodedToken.email, 'basic');
      user = { id: userDoc.id, ...userDoc.data() };
    }

    res.cookie('idToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    res.json({
      message: 'Login successful',
      user: {
        uid: user.uid || user.id,
        email: user.email,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Incorrect email or password' });
  }
}

async function logout(req, res) {
  try {
    res.clearCookie('idToken');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error during logout' });
  }
}

async function verify(req, res) {
  try {
    res.json({
      valid: true,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        plan: req.userInfo?.plan || 'basic'
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function getMe(req, res) {
  try {
    res.json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        plan: req.userInfo?.plan || 'basic',
        createdAt: req.userInfo?.createdAt
      }
    });
  } catch (error) {
    console.error('Current user fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function makeSuper(req, res) {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const { getUser, getDb } = require('../services/firebase.service');
    await getDb().collection('users').doc(uid).update({ role: 'super_admin' });
    const user = await getUser(uid);
    res.json({ message: 'User promoted to super admin', user });
  } catch (error) {
    console.error('Make super error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

async function isSuper(req, res) {
  res.json({ superAdmin: req.userRole === 'super_admin' });
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let resetLink;
    try {
      resetLink = await admin.auth().generatePasswordResetLink(email, {
        url: `${process.env.FRONTEND_URL || 'https://contrak-copie.vercel.app'}/login`
      });
    } catch (fbErr) {
      console.error('Firebase generatePasswordResetLink failed:', fbErr.message);
      resetLink = `https://contrak-copie.vercel.app/login?resetEmail=${encodeURIComponent(email)}`;
    }

    await sendPasswordResetEmail({ email, resetLink });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Error sending reset email' });
  }
}

module.exports = {
  register,
  login,
  logout,
  verify,
  getMe,
  makeSuper,
  isSuper,
  forgotPassword
};
