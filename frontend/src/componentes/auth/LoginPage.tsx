import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "../../contextos/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Lock, Mail, Zap } from "lucide-react";

// @Agent: UI/UX Designer (AUID) — Tela de Login Premium com Glassmorphism

const loginSchema = z.object({
    email: z.string().email("E-mail inválido."),
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

export function LoginPage() {
    const { login } = useAuth();
    const [carregando, setCarregando] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", senha: "" },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setCarregando(true);
        try {
            await login(values.email, values.senha);
            toast.success("Bem-vindo ao DukesFreela!", { description: "Autenticado com sucesso." });
        } catch (err: any) {
            toast.error("Falha ao entrar", { description: err.message });
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden selection:bg-indigo-500/30">

            {/* Gradientes de fundo decorativos */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/8 rounded-full blur-[100px]" />
            </div>

            {/* Grade sutil de fundo */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                }}
            />

            {/* Card de Login — Glassmorphism */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-6 duration-500">

                {/* Logo + Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/30 mb-4">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-white to-emerald-400 bg-clip-text text-transparent mb-1">
                        DukesFreela
                    </h1>
                    <p className="text-zinc-500 text-sm">Sistema de Gestão para Freelancers</p>
                </div>

                {/* Card */}
                <div className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-zinc-100">Acessar conta</h2>
                        <p className="text-zinc-500 text-sm mt-1">Entre com suas credenciais para continuar</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-400 text-sm">E-mail</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <Input
                                                type="email"
                                                placeholder="seu@email.com"
                                                className="pl-10 bg-zinc-800/50 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="senha" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-400 text-sm">Senha</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10 bg-zinc-800/50 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={carregando}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium py-2.5 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {carregando ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
                                    ) : (
                                        "Entrar no sistema"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>

                    {/* Separador */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-zinc-600 text-center">
                            MVP v0.1 · Ambiente de Desenvolvimento
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
