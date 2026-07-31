import User from '../models/User.js';

export function getProfile(req, res) {
  const user = req.user;
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  });
}

export async function updateProfile(req, res, next) {
  try {
    const updates = {};
    const { name, profile } = req.body;

    if (name) {
      updates.name = name;
    }

    if (profile && typeof profile === 'object') {
      updates.profile = {
        ...(req.user.profile || {}),
        ...profile
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-passwordHash');
    res.json({ message: 'Profile updated successfully.', user });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash');
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['student', 'coach', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User role updated successfully.', user });
  } catch (error) {
    next(error);
  }
}
