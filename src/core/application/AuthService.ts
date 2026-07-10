import { UserRepository } from "@/infrastructure/db/UserRepository";
import { User } from "@/core/domain/user";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "production_super_secure_jwt_secret_key_12345");

export interface MultiTenantSessionPayload {
  userId: string;
  email: string;
  fullName: string;
  preferredLocale: "en" | "ar";
  isSuperAdmin: boolean;
  activeTenantId?: string | null;
  activeRole?: string | null;
  permissions?: string[];
  impersonatorId?: string | null;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async authenticate(email: string, passwordHashInput: string): Promise<User | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.isActive) return null;

    // Verify password hash
    if (user.passwordHash !== passwordHashInput) {
      return null;
    }

    return user;
  }

  async createSessionToken(
    user: User,
    activeTenantId?: string | null,
    impersonatorId?: string | null
  ): Promise<string> {
    let permissions: string[] = [];
    let roleName: string | null = null;

    if (activeTenantId) {
      permissions = await this.userRepo.getUserPermissionsInTenant(activeTenantId, user.id);
      const members = await this.userRepo.getTenantMembers(activeTenantId);
      const myMem = members.find((m) => m.userId === user.id);
      if (myMem) {
        roleName = myMem.role.name;
      } else if (user.isSuperAdmin) {
        roleName = "System Super Administrator";
      }
    }

    const payload: MultiTenantSessionPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      preferredLocale: user.preferredLocale,
      isSuperAdmin: user.isSuperAdmin,
      activeTenantId: activeTenantId || null,
      activeRole: roleName,
      permissions,
      impersonatorId: impersonatorId || null,
    };

    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    return token;
  }

  async verifySessionToken(token: string): Promise<MultiTenantSessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as MultiTenantSessionPayload;
    } catch (e) {
      return null;
    }
  }

  async getImpersonationToken(adminUserId: string, targetUserId: string, targetTenantId: string): Promise<string | null> {
    const admin = await this.userRepo.findById(adminUserId);
    if (!admin || !admin.isSuperAdmin) return null;

    const targetUser = await this.userRepo.findById(targetUserId);
    if (!targetUser) return null;

    return this.createSessionToken(targetUser, targetTenantId, adminUserId);
  }
}
