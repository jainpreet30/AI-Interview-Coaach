import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'please_change_this_secret';

export function createToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      id: user._id, // Include both for compatibility
      name: user.name,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}
