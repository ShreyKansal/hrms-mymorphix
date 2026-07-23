import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

// Single shared Prisma client for the whole API. Every module injects this rather than
// instantiating its own client — see docs/build/00-architecture-and-tech-stack.md §4.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Runs `fn` inside a transaction with the Postgres session variable
   * `app.current_tenant_id` set for the duration of that transaction (SET LOCAL — scoped
   * to the transaction, never leaks onto a pooled connection reused by a different
   * request afterwards). The Row-Level Security policies in
   * prisma/migrations/20260723180000_row_level_security/migration.sql read this variable
   * to decide which rows are visible at all — this is what makes tenant isolation a
   * database-enforced guarantee (docs/hrms-prd/10-security-privacy-audit.md §1) rather
   * than something that only holds if every query everywhere remembered to add
   * `WHERE tenantId = ...`.
   *
   * Uses set_config() with a bound parameter, not string-interpolated SQL, specifically
   * to keep this safe against a malformed/malicious x-tenant-id header value.
   */
  async withTenant<T>(tenantId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      return fn(tx);
    });
  }
}
