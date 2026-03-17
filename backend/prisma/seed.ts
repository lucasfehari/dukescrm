import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// @Agent: Senior Programmer (ASP) — Seed de usuário Admin para desenvolvimento

const prisma = new PrismaClient();

async function main() {
    const email = "admin@dukes.com";

    const jaExiste = await prisma.usuario.findUnique({ where: { email } });
    if (jaExiste) {
        console.log(`[SEED] Usuário admin já existe: ${email}`);
        return;
    }

    const senhaHash = await bcrypt.hash("admin123", 12);

    const admin = await prisma.usuario.create({
        data: {
            nome: "Admin Dukes",
            email,
            senhaHash,
            funcao: "ADMINISTRADOR",
        },
    });

    console.log(`[SEED] ✅ Usuário admin criado com sucesso!`);
    console.log(`   📧 E-mail: ${admin.email}`);
    console.log(`   🔑 Senha: admin123`);
    console.log(`   🆔 ID: ${admin.id}`);
}

main()
    .catch((e) => {
        console.error("[SEED] ❌ Erro ao criar seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
