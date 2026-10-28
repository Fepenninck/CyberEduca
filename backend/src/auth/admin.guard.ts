import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

type RequestAutenticada = Request & {
  user?: {
    id: string;
    papel: string;
  };
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestAutenticada>();

    if (request.user?.papel !== 'ADMIN') {
      throw new ForbiddenException(
        'Apenas administradores podem realizar esta operação.',
      );
    }

    return true;
  }
}