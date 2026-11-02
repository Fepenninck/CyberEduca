import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminUsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listarUsuarios() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        papel: true,
        criadoEm: true,
        atualizadoEm: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarUsuario(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        papel: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return usuario;
  }

  async atualizarUsuario(id: string, dados: { nome?: string; email?: string }) {
    return this.prisma.usuario.update({
      where: { id },
      data: dados,
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        papel: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });
  }

  async excluirUsuario(id: string) {
    return this.prisma.usuario.delete({
      where: { id },
      select: { id: true, nome: true, email: true },
    });
  }
}
