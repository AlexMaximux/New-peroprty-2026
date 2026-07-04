import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const RequireApprovedAgency = Reflector.createDecorator<boolean>();

@Injectable()
export class ApprovedAgencyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(RequireApprovedAgency, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === 'ADMIN') {
      return true; // Admins bypass the agency check
    }

    const profile = await this.prisma.agencyProfile.findUnique({
      where: { userId: user.sub },
    });

    if (!profile) {
      throw new ForbiddenException('Agency profile required');
    }

    if (profile.verificationStatus === 'REJECTED') {
      throw new ForbiddenException(
        'Your agency profile has been rejected. You cannot perform this action.',
      );
    }

    return true;
  }
}