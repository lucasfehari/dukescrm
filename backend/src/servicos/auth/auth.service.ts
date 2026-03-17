import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginInput, RegisterInput } from "../../modelos/auth.schema.js";

// @Agent: Senior Programmer (ASP) + Segurança — Service de Autenticação

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRETO_DEV";
const JWT_EXPIRES = "7d";

export class AuthService {
    /**
     * Registra um novo usuário com senha hasheada via bcrypt.
     */
    static async registrar(dados: RegisterInput) {
        const jaExiste = await prisma.usuario.findUnique({ where: { email: dados.email } });
        if (jaExiste) throw new Error("E-mail já cadastrado no sistema.");

        const senhaHash = await bcrypt.hash(dados.senha, 12);

        const usuario = await prisma.usuario.create({
            data: {
                nome: dados.nome,
                email: dados.email,
                senhaHash,
                funcao: dados.funcao ?? "USUARIO",
            },
            select: { id: true, nome: true, email: true, funcao: true, criadoEm: true },
        });

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, funcao: usuario.funcao },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        return { usuario, token };
    }

    /**
     * Autentica um usuário verificando email e senha.
     * Protege contra timing attacks com bcrypt.compare.
     */
    static async login(dados: LoginInput) {
        const usuario = await prisma.usuario.findUnique({
            where: { email: dados.email },
            select: { id: true, nome: true, email: true, senhaHash: true, funcao: true, deletadoEm: true },
        });

        // Mensagem genérica para não revelar se o e-mail existe
        const ERRO_CREDENCIAIS = "Credenciais inválidas. Verifique seu e-mail e senha.";

        if (!usuario || usuario.deletadoEm) throw new Error(ERRO_CREDENCIAIS);

        const senhaCorreta = await bcrypt.compare(dados.senha, usuario.senhaHash);
        if (!senhaCorreta) throw new Error(ERRO_CREDENCIAIS);

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, funcao: usuario.funcao },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        const { senhaHash: _, ...usuarioSemSenha } = usuario;
        return { usuario: usuarioSemSenha, token };
    }

    /**
     * Valida um token JWT e retorna o payload decodificado.
     */
    static verificarToken(token: string) {
        try {
            return jwt.verify(token, JWT_SECRET) as { id: string; email: string; funcao: string };
        } catch {
            throw new Error("Token inválido ou expirado.");
        }
    }
}
