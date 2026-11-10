import { describe, expect, it, jest } from '@jest/globals';
import { AprendizagemService } from '../aprendizagem/aprendizagem.service';
import { ProvasService } from '../provas/provas.service';
import { SimulacoesService } from '../simulacoes/simulacoes.service';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminService } from './admin.service';
import { AdminUsuariosService } from './admin-usuarios.service';

const resultado = { sucesso: true };
const fn = () => jest.fn<(...args: any[]) => any>().mockReturnValue(resultado);

describe('AdminController', () => {
  it('encaminha as operações administrativas para o service correspondente', () => {
    const dashboardService = { buscarResumoDashboard: fn() };
    const adminService = { listarResultadosProvas: fn(), listarResultadosSimulacoes: fn() };
    const usuariosService = {
      listarUsuarios: fn(), buscarUsuario: fn(), excluirUsuario: fn(), atualizarUsuario: fn(),
    };
    const aprendizagemService = {
      listarTrilhasAdmin: fn(), listarAulasAdmin: fn(), criarTrilha: fn(), editarTrilha: fn(),
      excluirTrilha: fn(), criarAula: fn(), editarAula: fn(), excluirAula: fn(),
    };
    const provasService = {
      listarAdmin: fn(), criar: fn(), atualizar: fn(), alterarStatus: fn(), excluir: fn(),
      adicionarQuestao: fn(), adicionarAlternativa: fn(),
    };
    const simulacoesService = {
      listarAdmin: fn(), listarCategoriasAdmin: fn(), criarCategoria: fn(), excluirCategoria: fn(),
      buscarAdmin: fn(), criar: fn(), atualizar: fn(), excluir: fn(),
    };
    const controller = new AdminController(
      dashboardService as unknown as AdminDashboardService,
      adminService as unknown as AdminService,
      usuariosService as unknown as AdminUsuariosService,
      aprendizagemService as unknown as AprendizagemService,
      provasService as unknown as ProvasService,
      simulacoesService as unknown as SimulacoesService,
    );

    expect(controller.buscarResumoDashboard()).toBe(resultado);
    expect(dashboardService.buscarResumoDashboard).toHaveBeenCalled();
    expect(controller.listarResultadosProvas()).toBe(resultado);
    expect(adminService.listarResultadosProvas).toHaveBeenCalled();
    expect(controller.listarResultadosSimulacoes()).toBe(resultado);
    expect(adminService.listarResultadosSimulacoes).toHaveBeenCalled();

    expect(controller.listarUsuarios()).toBe(resultado);
    expect(usuariosService.listarUsuarios).toHaveBeenCalled();
    expect(controller.buscarUsuario('u1')).toBe(resultado);
    expect(usuariosService.buscarUsuario).toHaveBeenCalledWith('u1');
    expect(controller.excluirUsuario('u1')).toBe(resultado);
    expect(usuariosService.excluirUsuario).toHaveBeenCalledWith('u1');
    expect(controller.atualizarUsuario('u1', { nome: 'Ana' })).toBe(resultado);
    expect(usuariosService.atualizarUsuario).toHaveBeenCalledWith('u1', { nome: 'Ana' });

    expect(controller.listarTrilhas()).toBe(resultado);
    expect(aprendizagemService.listarTrilhasAdmin).toHaveBeenCalled();
    expect(controller.listarAulas()).toBe(resultado);
    expect(aprendizagemService.listarAulasAdmin).toHaveBeenCalled();
    expect(controller.criarTrilha({} as any)).toBe(resultado);
    expect(aprendizagemService.criarTrilha).toHaveBeenCalled();
    expect(controller.editarTrilha('t1', {} as any)).toBe(resultado);
    expect(aprendizagemService.editarTrilha).toHaveBeenCalledWith('t1', {});
    expect(controller.excluirTrilha('t1')).toBe(resultado);
    expect(aprendizagemService.excluirTrilha).toHaveBeenCalledWith('t1');
    expect(controller.criarAula({} as any)).toBe(resultado);
    expect(aprendizagemService.criarAula).toHaveBeenCalled();
    expect(controller.editarAula('a1', {})).toBe(resultado);
    expect(aprendizagemService.editarAula).toHaveBeenCalledWith('a1', {});
    expect(controller.excluirAula('a1')).toBe(resultado);
    expect(aprendizagemService.excluirAula).toHaveBeenCalledWith('a1');

    expect(controller.listarProvas()).toBe(resultado);
    expect(provasService.listarAdmin).toHaveBeenCalled();
    expect(controller.criarProva({} as any)).toBe(resultado);
    expect(provasService.criar).toHaveBeenCalled();
    expect(controller.atualizarProva('p1', {} as any)).toBe(resultado);
    expect(provasService.atualizar).toHaveBeenCalledWith('p1', {});
    expect(controller.alterarStatusProva('p1', { status: 'RASCUNHO' } as any)).toBe(resultado);
    expect(provasService.alterarStatus).toHaveBeenCalledWith('p1', 'RASCUNHO');
    expect(controller.excluirProva('p1')).toBe(resultado);
    expect(provasService.excluir).toHaveBeenCalledWith('p1');
    expect(controller.adicionarQuestao('p1', {} as any)).toBe(resultado);
    expect(provasService.adicionarQuestao).toHaveBeenCalledWith('p1', {});
    expect(controller.adicionarAlternativa('p1', 'q1', {} as any)).toBe(resultado);
    expect(provasService.adicionarAlternativa).toHaveBeenCalledWith('p1', 'q1', {});

    expect(controller.listarSimulacoes()).toBe(resultado);
    expect(simulacoesService.listarAdmin).toHaveBeenCalled();
    expect(controller.listarCategoriasSimulacao()).toBe(resultado);
    expect(simulacoesService.listarCategoriasAdmin).toHaveBeenCalled();
    expect(controller.criarCategoriaSimulacao({} as any)).toBe(resultado);
    expect(simulacoesService.criarCategoria).toHaveBeenCalled();
    expect(controller.excluirCategoriaSimulacao('c1')).toBe(resultado);
    expect(simulacoesService.excluirCategoria).toHaveBeenCalledWith('c1');
    expect(controller.buscarSimulacao('s1')).toBe(resultado);
    expect(simulacoesService.buscarAdmin).toHaveBeenCalledWith('s1');
    expect(controller.criarSimulacao({} as any)).toBe(resultado);
    expect(simulacoesService.criar).toHaveBeenCalled();
    expect(controller.atualizarSimulacao('s1', {} as any)).toBe(resultado);
    expect(simulacoesService.atualizar).toHaveBeenCalledWith('s1', {});
    expect(controller.excluirSimulacao('s1')).toBe(resultado);
    expect(simulacoesService.excluir).toHaveBeenCalledWith('s1');
  });
});
