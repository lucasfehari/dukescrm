import { PrismaClient } from "@prisma/client";
import type { ProjetoCreateInput, ProjetoUpdateInput } from "../../modelos/projetos.schema.js";
import { criarLog } from "../../utilitarios/auditoria.js";
import { CreditoService } from "../creditos/creditos.service.js";

// @Agent: Senior Programmer (ASP) — Service do Módulo de Projetos
// Suporta projetos normais (via Contrato) e Serviços Avulsos (via Cliente)

const prisma = new PrismaClient();

export class ProjetoService {
    static async criar(dados: ProjetoCreateInput, usuarioId: string) {
        // Valida contrato se fornecido
        if (dados.contratoId) {
            const contrato = await prisma.contrato.findFirst({ where: { id: dados.contratoId, deletadoEm: null } });
            if (!contrato) throw new Error("Contrato não encontrado.");
        }

        // Valida cliente se serviço avulso
        if (dados.avulso && dados.clienteId) {
            const cliente = await prisma.cliente.findFirst({ where: { id: dados.clienteId, deletadoEm: null } });
            if (!cliente) throw new Error("Cliente não encontrado.");
        }

        // Se creditoId informado → valida saldo e decrementa (descontando do pacote do contrato)
        if (dados.creditoId) {
            await CreditoService.decrementar(dados.creditoId);
        }

        const projeto = await prisma.projeto.create({
            data: {
                contratoId: dados.contratoId ?? null,
                clienteId: dados.clienteId ?? null,
                creditoId: dados.creditoId ?? null,
                tipoProjeto: dados.tipoProjeto ?? null,
                avulso: dados.avulso ?? false,
                valorAvulso: dados.valorAvulso ? dados.valorAvulso : null,
                nome: dados.nome,
                descricao: dados.descricao || null,
                servicos: dados.servicos ? (dados.servicos as any) : null,
                status: dados.status ?? "NAO_INICIADO",
                prazoEstimado: dados.prazoEstimado ? new Date(dados.prazoEstimado) : null,
            } as any,
            include: {
                contrato: { select: { id: true, titulo: true, cliente: { select: { nome: true } } } },
                cliente: { select: { id: true, nome: true } },
                creditoUsado: { select: { id: true, nome: true, quantidadeTotal: true, quantidadeUsada: true } },
            } as any,
        });

        // Se serviço avulso com valor → cria lancamento RECEITA PENDENTE automaticamente
        if (dados.avulso && dados.valorAvulso && dados.valorAvulso > 0) {
            const hoje = new Date();
            const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
            const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); // último dia do mês

            await prisma.financeiro.create({
                data: {
                    projetoId: projeto.id,
                    tipo: "RECEITA",
                    valor: dados.valorAvulso,
                    descricao: `Serviço Avulso: ${dados.nome}`,
                    status: "PENDENTE",
                    dataVencimento: vencimento,
                    mesReferencia,
                } as any,
            });
        }

        await criarLog({ usuarioId, acao: "CREATE", entidade: "Projeto", entidadeId: projeto.id, detalhes: dados });
        return projeto;
    }

    static async listarTodos(contratoId?: string) {
        return prisma.projeto.findMany({
            where: {
                deletadoEm: null,
                ...(contratoId ? { contratoId } : {}),
            },
            include: {
                contrato: { select: { id: true, titulo: true, cliente: { select: { nome: true } } } },
                cliente: { select: { id: true, nome: true } },
            },
            orderBy: { criadoEm: "desc" },
        });
    }

    static async buscarPorId(id: string) {
        return prisma.projeto.findFirst({
            where: { id, deletadoEm: null },
            include: {
                contrato: { include: { cliente: true } },
                cliente: true,
                financeiro: { where: { deletadoEm: null } },
            },
        });
    }

    static async atualizarStatus(id: string, status: string, usuarioId: string) {
        const atual = await ProjetoService.buscarPorId(id);
        if (!atual) throw new Error("Projeto não encontrado.");

        const atualizado = await prisma.projeto.update({
            where: { id },
            data: {
                status: status as any,
                concluidoEm: status === "CONCLUIDO" ? new Date() : null,
            },
        });

        await criarLog({ usuarioId, acao: "UPDATE", entidade: "Projeto", entidadeId: id, detalhes: { status } });
        return atualizado;
    }

    static async atualizar(id: string, dados: ProjetoUpdateInput, usuarioId: string) {
        const atual = await ProjetoService.buscarPorId(id);
        if (!atual) throw new Error("Projeto não encontrado.");

        const atualizado = await prisma.projeto.update({
            where: { id },
            data: {
                ...dados,
                descricao: dados.descricao || null,
                servicos: dados.servicos ? (dados.servicos as any) : undefined,
                prazoEstimado: dados.prazoEstimado ? new Date(dados.prazoEstimado) : undefined,
            } as any,
        });

        await criarLog({ usuarioId, acao: "UPDATE", entidade: "Projeto", entidadeId: id, detalhes: { antes: atual, depois: atualizado } });
        return atualizado;
    }

    static async deletarLogico(id: string, usuarioId: string) {
        const atual = await ProjetoService.buscarPorId(id);
        if (!atual) throw new Error("Projeto não encontrado.");

        // Devolve o crédito ao pacote caso o projeto estivesse vinculado
        if ((atual as any).creditoId) {
            await CreditoService.devolver((atual as any).creditoId);
        }

        await prisma.projeto.update({ where: { id }, data: { deletadoEm: new Date() } });
        await criarLog({ usuarioId, acao: "SOFT_DELETE", entidade: "Projeto", entidadeId: id });
    }

    static async resumoPorStatus() {
        const projetos = await prisma.projeto.findMany({ where: { deletadoEm: null } });
        const contagens: Record<string, number> = {
            NAO_INICIADO: 0, EM_ANDAMENTO: 0, IMPEDIDO: 0, CONCLUIDO: 0, CANCELADO: 0,
        };
        for (const p of projetos) if (p.status) contagens[String(p.status)] = (contagens[String(p.status)] ?? 0) + 1;
        return contagens;
    }
}
