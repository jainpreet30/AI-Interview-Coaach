import bcrypt from 'bcryptjs';

export function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, 12);
}

export function comparePassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}
