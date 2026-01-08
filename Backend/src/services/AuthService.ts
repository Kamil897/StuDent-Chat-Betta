import { roleRepository } from "../repositories/RoleRepository.js";
import { userRepository } from "../repositories/UserRepository.js";
import { sessionRepository } from "../repositories/SessionRepository.js";
import { authRepository } from "../repositories/AuthRepository.js";
import type {
  AuthResponseDto,
  AuthUserDto,
  LoginRequestDto,
  RegisterRequestDto,
} from "../dtos/auth.dto.js";
import { comparePassword, hashPassword, hashToken } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

export class AuthService {
  private mapUserToAuthDto(user: {
    id: string;
    name: string;
    surname: string | null;
    email: string;
    username: string;
    avatarSeed: string | null;
    emailVerified: boolean;
    roles: { roleId: number }[];
  }, roleNames: string[]): AuthUserDto {
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      username: user.username,
      avatarSeed: user.avatarSeed,
      emailVerified: user.emailVerified,
      roles: roleNames,
    };
  }

  async register(data: RegisterRequestDto): Promise<AuthResponseDto> {
    const existingByEmail = await userRepository.findByEmail(data.email);
    if (existingByEmail) {
      const err: any = new Error("Email already in use");
      err.statusCode = 409;
      throw err;
    }

    const existingByUsername = await userRepository.findByUsername(
      data.username,
    );
    if (existingByUsername) {
      const err: any = new Error("Username already in use");
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await hashPassword(data.password);

    const user = await userRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
      name: data.name,
      surname: data.surname ?? null,
      avatarSeed: null,
      // emailVerified имеет default(false) в схеме, не нужно передавать явно
    });

    const userRole = await roleRepository.ensureRole("user");
    await authRepository.attachRoleToUser(user.id, userRole.id);

    const fullUser = await authRepository.getUserWithRolesById(user.id);
    if (!fullUser) {
      const err: any = new Error("User not found after registration");
      err.statusCode = 500;
      throw err;
    }

    const roleIds = fullUser.roles.map((r: any) => r.roleId);
    const roles = await Promise.all(
      roleIds.map((id: number) => roleRepository.ensureRole(String(id))),
    );
    const roleNames = roles.map((r: any) => r.name);

    const accessToken = signAccessToken(user.id, roleNames);
    const refreshToken = signRefreshToken(user.id);
    const refreshHash = await hashToken(refreshToken);

    const now = new Date();
    const refreshExpires = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    ); // 7 days fallback

    await sessionRepository.create({
      user: { connect: { id: user.id } },
      refreshToken: refreshHash,
      expiresAt: refreshExpires,
    });

    const authUser = this.mapUserToAuthDto(fullUser, roleNames);

    // Send verification code after registration (async, don't wait for it)
    const { emailVerificationService } = await import("./EmailVerificationService.js");
    emailVerificationService.sendVerificationCode(data.email).catch((err) => {
      console.error("[AuthService] Failed to send verification code:", err);
      // Don't fail registration if email sending fails
    });

    return {
      user: authUser,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(data: LoginRequestDto): Promise<AuthResponseDto> {
    const userWithRoles = await authRepository.getUserWithRolesByEmailOrUsername(
      { email: data.email, username: data.username },
    );

    if (!userWithRoles) {
      const err: any = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }

    const isValid = await comparePassword(
      data.password,
      userWithRoles.passwordHash,
    );

    if (!isValid) {
      const err: any = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }

    const roleIds = userWithRoles.roles.map((r: any) => r.roleId);
    const roles = await Promise.all(
      roleIds.map((id: number) => roleRepository.ensureRole(String(id))),
    );
    const roleNames = roles.map((r: any) => r.name);

    const accessToken = signAccessToken(userWithRoles.id, roleNames);
    const refreshToken = signRefreshToken(userWithRoles.id);
    const refreshHash = await hashToken(refreshToken);

    const now = new Date();
    const refreshExpires = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    ); // 7 days fallback

    await sessionRepository.create({
      user: { connect: { id: userWithRoles.id } },
      refreshToken: refreshHash,
      expiresAt: refreshExpires,
    });

    const authUser = this.mapUserToAuthDto(userWithRoles, roleNames);

    return {
      user: authUser,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(rawRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      const err: any = new Error("Invalid refresh token");
      err.statusCode = 401;
      throw err;
    }

    const userId = payload.sub;
    const userWithRoles = await authRepository.getUserWithRolesById(userId);

    if (!userWithRoles) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    // For hashed refresh tokens we store only hash; actual matching of token to session
    // would typically require searching all sessions and comparing hashes.
    // For simplicity we just create a new session here.

    const roleIds = userWithRoles.roles.map((r: any) => r.roleId);
    const roles = await Promise.all(
      roleIds.map((id: number) => roleRepository.ensureRole(String(id))),
    );
    const roleNames = roles.map((r: any) => r.name);

    const newAccessToken = signAccessToken(userId, roleNames);
    const newRefreshToken = signRefreshToken(userId);
    const newRefreshHash = await hashToken(newRefreshToken);

    const now = new Date();
    const refreshExpires = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    await sessionRepository.create({
      user: { connect: { id: userId } },
      refreshToken: newRefreshHash,
      expiresAt: refreshExpires,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    await sessionRepository.revokeByUserId(userId);
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    const userWithRoles = await authRepository.getUserWithRolesById(userId);
    if (!userWithRoles) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    const roleIds = userWithRoles.roles.map((r: any) => r.roleId);
    const roles = await Promise.all(
      roleIds.map((id: number) => roleRepository.ensureRole(String(id))),
    );
    const roleNames = roles.map((r: any) => r.name);

    return this.mapUserToAuthDto(userWithRoles, roleNames);
  }
}

export const authService = new AuthService();


