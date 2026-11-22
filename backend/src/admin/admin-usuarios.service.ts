import { mascararEmailUsuario } from '../common/privacidade';
import { excluirDadosConta } from '../usuarios/excluir-dados-conta';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminUsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarUsuarios() {
    const usuarios = await this.prisma.usuario.findMany({
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
    return usuarios.map(mascararEmailUsuario);
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
    if (dados.email) {
      dados.email = dados.email.trim().toLowerCase();

      const emailEmUso = await this.prisma.usuario.findUnique({
        where: { email: dados.email },
        select: { id: true },
      });

      if (emailEmUso && emailEmUso.id !== id) {
        throw new ConflictException('Este e-mail já está em uso.');
      }
    }

    try {
      return await this.prisma.usuario.update({
        where: { id },
        data: { nome: dados.nome, email: dados.email },
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Este e-mail já está em uso.');
      }
      throw error;
    }
  }

  async excluirUsuario(id: string) {
    await excluirDadosConta(this.prisma, id);
    return { id };
  }
}
