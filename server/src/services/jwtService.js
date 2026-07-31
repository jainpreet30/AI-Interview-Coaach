import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'please_change_this_secret';

export function createToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, secret);
}
