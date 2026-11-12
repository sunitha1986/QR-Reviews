import { Client, User } from '../models/index.js';
import { pool } from '../config/db.js';
import { cleanPhoneNumber } from '../utils/phone.js';

/**
 * Authentication & Security Controller
 */
class AuthController {
  /**
   * User login (supports Superadmin, default admin, and onboarded business credentials)
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Registered phone number and password are required' });
      }

      const cleanUser = username.trim().toLowerCase();
      const cleanPhone = cleanPhoneNumber(username);

      // 1. Superadmin authentication by registered phone number, username, or env phone
      const [superUsers] = await pool.execute(
        "SELECT * FROM users WHERE (phone = ? OR phone = ? OR LOWER(username) = ? OR LOWER(id) = ?) AND role = 'superadmin' LIMIT 1",
        [cleanUser, cleanPhone, cleanUser, cleanUser]
      );
      const matchedSuper = superUsers[0];

      const envSuperPhone = (process.env.SUPERADMIN_PHONE || '9999999999').trim().toLowerCase();
      const isSuperUserMatch = matchedSuper || (cleanUser === 'sadmin') || (cleanUser === envSuperPhone) || (cleanPhone === envSuperPhone);

      if (isSuperUserMatch) {
        const expectedSuperPass = matchedSuper ? matchedSuper.password : 'sadmin@123';
        if (password === expectedSuperPass || password === 'sadmin@123') {
          const superPhone = matchedSuper?.phone || envSuperPhone;
          return res.json({
            user: {
              id: matchedSuper ? matchedSuper.id : 'user-superadmin-1',
              username: superPhone,
              phone: superPhone,
              name: matchedSuper?.name || 'Super Admin',
              role: 'superadmin'
            },
            token: 'token-superadmin-' + Date.now()
          });
        }
      }

      // Reject generic 'admin' username - admin login MUST be a registered client's phone number
      if (cleanUser === 'admin') {
        return res.status(401).json({ error: 'Please enter your registered 10-digit phone number' });
      }

      // 2. Client Admin authentication by registered phone number
      let matchedClient = await Client.findByUsernameOrPhone(cleanUser);
      if (!matchedClient && cleanPhone) {
        matchedClient = await Client.findByUsernameOrPhone(cleanPhone);
      }

      if (matchedClient) {
        const expectedPassword = matchedClient.password || 'admin@123';
        if (password === expectedPassword) {
          return res.json({
            user: {
              id: 'user-' + matchedClient.id,
              username: matchedClient.phone,
              phone: matchedClient.phone,
              name: matchedClient.name,
              role: 'admin',
              clientId: matchedClient.id,
              qrId: matchedClient.qrId
            },
            token: 'token-client-' + matchedClient.id + '-' + Date.now()
          });
        }
      }

      return res.status(401).json({ error: 'Invalid registered phone number or password' });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server authentication error: ' + err.message });
    }
  }

  /**
   * Verify password to unlock editing client records
   * POST /api/clients/verify-unlock
   */
  static async verifyUnlock(req, res) {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'Password is required to unlock' });
      }

      const cleanPass = password.trim();
      // Super admin password or default admin password
      if (cleanPass === 'sadmin@123' || cleanPass === 'admin@123') {
        return res.json({ success: true, message: 'Password verified. Record unlocked.' });
      }

      // Check if matches any client's individual password
      const clients = await Client.getAll();
      const match = clients.some(c => c.password === cleanPass);
      if (match) {
        return res.json({ success: true, message: 'Password verified. Record unlocked.' });
      }

      return res.status(401).json({ error: 'Incorrect password. Superadmin authorization required to unlock.' });
    } catch (err) {
      res.status(500).json({ error: 'Unlock verification failed: ' + err.message });
    }
  }

  /**
   * Change client or admin password
   * POST /api/clients/change-password
   */
  static async changePassword(req, res) {
    try {
      const { clientId, currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      if (newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'New password must be at least 4 characters.' });
      }

      // 1. Check if it's default admin user
      if (clientId === 'user-client-1' || clientId === 'admin' || !clientId) {
        const user = await User.findByUsername('admin');
        if (user) {
          const isCurrentValid = (currentPassword.trim() === user.password) || (currentPassword.trim() === 'sadmin@123');
          if (!isCurrentValid) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
          }
          await pool.execute('UPDATE users SET password = ? WHERE id = ?', [newPassword.trim(), user.id]);
          return res.json({
            success: true,
            message: 'Admin password updated successfully. Please use your new password next time you log in.'
          });
        }
      }

      // 2. Check in clients table
      let client = await Client.findById(clientId);
      if (!client) {
        client = await Client.findByIdOrQr(clientId);
      }

      if (!client) {
        // Also check users table by username or id
        const user = await User.findByUsername(clientId);
        if (user) {
          const isCurrentValid = (currentPassword.trim() === user.password) || (currentPassword.trim() === 'sadmin@123');
          if (!isCurrentValid) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
          }
          await pool.execute('UPDATE users SET password = ? WHERE id = ?', [newPassword.trim(), user.id]);
          return res.json({
            success: true,
            message: 'Password updated successfully. Please use your new password next time you log in.'
          });
        }
        return res.status(404).json({ error: 'Account not found' });
      }

      // Verify current password or superadmin override
      const isCurrentValid = (currentPassword.trim() === client.password) ||
                             (currentPassword.trim() === 'sadmin@123') ||
                             (!client.password && currentPassword.trim() === 'admin@123');

      if (!isCurrentValid) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      await Client.update(client.id, {
        password: newPassword.trim()
      });

      res.json({
        success: true,
        message: 'Password updated successfully. Please use your new password next time you log in.'
      });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Failed to update password: ' + err.message });
    }
  }

  /**
   * Update superadmin or user profile (phone / name)
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      const { id, phone, name } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'User identifier is required' });
      }

      const cleanPhone = phone ? cleanPhoneNumber(phone) : null;
      const cleanName = name ? name.trim() : null;

      // Check users table
      const [rows] = await pool.execute(
        "SELECT * FROM users WHERE id = ? OR LOWER(username) = ? OR phone = ? LIMIT 1",
        [id, id.toLowerCase(), id]
      );
      const user = rows[0];
      if (user) {
        await pool.execute(
          "UPDATE users SET phone = COALESCE(?, phone), name = COALESCE(?, name) WHERE id = ?",
          [cleanPhone, cleanName, user.id]
        );
        return res.json({
          success: true,
          message: 'Profile updated successfully',
          user: {
            ...user,
            phone: cleanPhone || user.phone,
            name: cleanName || user.name,
            username: cleanPhone || user.phone || user.username
          }
        });
      }

      return res.status(404).json({ error: 'User not found' });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Failed to update profile: ' + err.message });
    }
  }
}

export { AuthController };
export default AuthController;
