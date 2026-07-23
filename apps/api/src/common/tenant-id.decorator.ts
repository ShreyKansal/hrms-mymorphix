import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

/**
 * TEMPORARY, Sprint-1-only mechanism for identifying the current tenant.
 *
 * Real tenant resolution belongs to auth (part of Module 21 / Foundation), which will
 * derive it from the authenticated session, not a raw header. Every controller using
 * this decorator today is a marker for "needs to move to real auth once that exists" —
 * do not treat this as the permanent pattern. See docs/build/00-architecture-and-tech-stack.md §7.
 */
export const TenantId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const tenantId = request.headers['x-tenant-id'];
  if (!tenantId || typeof tenantId !== 'string') {
    throw new BadRequestException(
      'Missing x-tenant-id header. (Sprint 1 stand-in for real auth — see tenant-id.decorator.ts.)',
    );
  }
  return tenantId;
});
