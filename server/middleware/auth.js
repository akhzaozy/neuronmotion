import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'neuronmotion-secret-key';

/** Memverifikasi Bearer token dan mengisi req.user = { userId, role }. */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token diperlukan' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa' });
  }
}
