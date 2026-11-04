import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// Guard provisorio: valida o papel do usuario ja identificado pelo JwtAuthGuard.
// Usar sempre depois do JwtAuthGuard: @UseGuards(JwtAuthGuard, AdminGuard)
// Substituir pelo AdminGuard do Caio quando a branch dele for integrada.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario || usuario.papel !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }

    return true;
  }
}
