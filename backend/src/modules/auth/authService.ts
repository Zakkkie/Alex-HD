import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { config } from '../../config/env';
import { dbStore } from '../../db/store';
import { User, Device, AuthResponse } from '../../../../src/types';

export class AuthService {
  private static passwordHashes = new Map<string, string>([
    ['admin@smarttv.com', bcryptjs.hashSync('admin123', 10)],
    ['admin', bcryptjs.hashSync('admin123', 10)]
  ]);

  static verifyDeviceLimit(userId: string, deviceId: string, deviceName?: string, platform?: any): { allowed: boolean; devicesCount: number } {
    const userDevices = dbStore.devices.filter(d => d.user_id === userId);
    const existingDevice = userDevices.find(d => d.device_id === deviceId);

    if (existingDevice) {
      existingDevice.last_active_at = new Date().toISOString();
      return { allowed: true, devicesCount: userDevices.length };
    }

    if (userDevices.length >= config.maxDevicesPerUser) {
      return { allowed: false, devicesCount: userDevices.length };
    }

    // Register new device
    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName || `Smart TV (${platform || 'tizen'})`,
      platform: platform || 'tizen',
      last_active_at: new Date().toISOString()
    };
    dbStore.devices.push(newDevice);

    return { allowed: true, devicesCount: userDevices.length + 1 };
  }

  static generateTokens(user: User, deviceId: string) {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, deviceId },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, deviceId },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }

  static register(email: string, pass: string, username?: string, deviceId?: string, deviceName?: string, platform?: any): { status: number; body: any } {
    const normalizedEmail = email.toLowerCase().trim();
    if (dbStore.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { status: 400, body: { error: 'EMAIL_ALREADY_EXISTS', message: 'Пользователь с таким email уже зарегистрирован.' } };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      username: username || normalizedEmail.split('@')[0],
      role: 'user',
      is_blocked: false,
      created_at: new Date().toISOString()
    };
    dbStore.users.push(newUser);
    const hash = bcryptjs.hashSync(pass || '123456', 10);
    this.passwordHashes.set(normalizedEmail, hash);

    return this.processAuthForUser(newUser, deviceId || 'tizen-duid-default-01', deviceName, platform);
  }

  static login(email: string, pass: string, deviceId: string, deviceName?: string, platform?: any): { status: number; body: any } {
    const query = email.toLowerCase().trim();
    const user = dbStore.users.find(u => 
      u.email.toLowerCase() === query || 
      u.username.toLowerCase() === query ||
      (query === 'admin' && u.role === 'admin')
    );
    if (!user) {
      return { status: 401, body: { error: 'INVALID_CREDENTIALS', message: 'Пользователь не найден. Зарегистрируйтесь.' } };
    }

    if (user.is_blocked) {
      return { status: 403, body: { error: 'ACCOUNT_BLOCKED', message: 'Учетная запись заблокирована администратором.' } };
    }

    // Verify hashed password
    const hash = this.passwordHashes.get(query) || this.passwordHashes.get(user.email.toLowerCase());
    if (!hash || !bcryptjs.compareSync(pass, hash)) {
      return { status: 401, body: { error: 'INVALID_CREDENTIALS', message: 'Неверный логин или пароль.' } };
    }

    return this.processAuthForUser(user, deviceId, deviceName, platform);
  }

  static loginWithGoogle(googleId: string, email: string, displayName?: string, deviceId?: string, deviceName?: string, platform?: any): { status: number; body: any } {
    const normalizedEmail = (email || `google_${googleId}@gmail.com`).toLowerCase().trim();
    let user = dbStore.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      user = {
        id: `usr-google-${Date.now()}`,
        email: normalizedEmail,
        username: displayName || normalizedEmail.split('@')[0],
        role: 'user',
        is_blocked: false,
        created_at: new Date().toISOString()
      };
      dbStore.users.push(user);
    }

    if (user.is_blocked) {
      return { status: 403, body: { error: 'ACCOUNT_BLOCKED', message: 'Учетная запись заблокирована администратором.' } };
    }

    return this.processAuthForUser(user, deviceId || 'tizen-duid-default-01', deviceName || 'Google Auth Client', platform);
  }

  static loginWithApple(appleSub: string, email?: string, fullName?: string, deviceId?: string, deviceName?: string, platform?: any): { status: number; body: any } {
    const normalizedEmail = (email || `apple_${appleSub.slice(0, 10)}@privaterelay.appleid.com`).toLowerCase().trim();
    let user = dbStore.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      user = {
        id: `usr-apple-${Date.now()}`,
        email: normalizedEmail,
        username: fullName || `Apple User ${appleSub.slice(-4)}`,
        role: 'user',
        is_blocked: false,
        created_at: new Date().toISOString()
      };
      dbStore.users.push(user);
    }

    if (user.is_blocked) {
      return { status: 403, body: { error: 'ACCOUNT_BLOCKED', message: 'Учетная запись заблокирована администратором.' } };
    }

    return this.processAuthForUser(user, deviceId || 'tizen-duid-default-01', deviceName || 'Apple ID Client', platform);
  }

  private static processAuthForUser(user: User, deviceId: string, deviceName?: string, platform?: any): { status: number; body: any } {
    const deviceCheck = this.verifyDeviceLimit(user.id, deviceId, deviceName, platform);
    if (!deviceCheck.allowed) {
      return {
        status: 403,
        body: {
          error: 'DEVICE_LIMIT_EXCEEDED',
          code: 'DEVICE_LIMIT_EXCEEDED',
          message: 'Превышен лимит привязанных устройств (максимум 3). Удалите неиспользуемые устройства в профиле.',
          devicesCount: deviceCheck.devicesCount,
          maxDevices: config.maxDevicesPerUser
        }
      };
    }

    const tokens = this.generateTokens(user, deviceId);
    const response: AuthResponse = {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      devicesCount: deviceCheck.devicesCount
    };

    return { status: 200, body: response };
  }
}
