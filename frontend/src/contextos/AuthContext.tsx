import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// @Agent: Senior Programmer (ASP) — AuthContext para gerenciar sessão no frontend

interface Usuario {
    id: string;
    nome: string;
    email: string;
    funcao: string;
}

interface AuthContextType {
    usuario: Usuario | null;
    token: string | null;
    isAutenticado: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(() => {
        const salvo = localStorage.getItem("dukes:usuario");
        return salvo ? JSON.parse(salvo) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("dukes:token"));

    const login = useCallback(async (email: string, senha: string) => {
        const resp = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
        });

        if (!resp.ok) {
            const erro = await resp.json().catch(() => ({}));
            throw new Error(erro?.erro || "Falha ao autenticar. Tente novamente.");
        }

        const data: { usuario: Usuario; token: string } = await resp.json();
        setUsuario(data.usuario);
        setToken(data.token);
        localStorage.setItem("dukes:usuario", JSON.stringify(data.usuario));
        localStorage.setItem("dukes:token", data.token);
    }, []);

    const logout = useCallback(() => {
        setUsuario(null);
        setToken(null);
        localStorage.removeItem("dukes:usuario");
        localStorage.removeItem("dukes:token");
    }, []);

    return (
        <AuthContext.Provider value={{ usuario, token, isAutenticado: !!token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
    return ctx;
}
