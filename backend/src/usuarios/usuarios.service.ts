import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
    constructor(private readonly prisma: PrismaService) {}

    async criar(nome: string, email: string, senha: string) {
        const senhaHash = await bcrypt.hash(senha, 10);

        return this.prisma.usuario.create({
            data: {
                nome,
                email,
                senhaHash,
            },
            select: {
                id: true,
                nome: true,
                email: true,
                papel: true,
                criadoEm: true,
                atualizadoEm: true,
            },
        });
    }

    async buscarPorId(id: string) {
        const usuario = await
        this.prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                papel: true,
                criadoEm: true,
                atualizadoEm: true,
            },
        });

        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado');
        }
        return usuario;
    }

    async buscarPorEmail(email: string) {
        return this.prisma.usuario.findUnique({
            where: { email },
            });
            }
            
            async atualizar(
                id: string,
                dados: { nome?: string; email?: string; senha?: string },
            ) {
                const data: {

                    nome?: string;
                    email?: string;
                    senhaHash?: string;
                } = {


                nome: dados.nome,
                email: dados.email,
                   
                };

                if (dados.senha) {
                    data.senhaHash = await bcrypt.hash(dados.senha, 10);
                }

                return this.prisma.usuario.update({


                    where: { id },
                    data,
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        papel: true,
                        criadoEm: true,
                        atualizadoEm: true,
                    },
                });
                
            }
            

} 