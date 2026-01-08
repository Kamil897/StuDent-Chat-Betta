import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class RoleRepository {
  async findByName(name: string): Promise<Role | null> {
    return prisma.role.findUnique({ where: { name } });
  }

  async create(name: string): Promise<Role> {
    return prisma.role.create({ data: { name } });
  }

  async ensureRole(name: string): Promise<Role> {
    const existing = await this.findByName(name);
    if (existing) return existing;
    return this.create(name);
  }
}

export const roleRepository = new RoleRepository();




