import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

type UsuarioAutenticado = {
  papel?: string;
  role?: string;
};

type RequisicaoAdmin = Request & {
  user?: UsuarioAutenticado;
};

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequisicaoAdmin>();
    const usuario = request.user;

    if ((usuario?.papel ?? usuario?.role) !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }

    return true;
  }
}
