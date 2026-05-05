"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthService from "../services/AuthService";

interface User {
    id: number;
    name: string;
    email?: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const checkAuth = async () => {
        setLoading(true);
        try {
            const response = await AuthService.getMe();
            setUser(response.data.user ?? null);
            setIsAuthenticated(true);
            setError(null);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            await AuthService.login(username, password);
            await checkAuth();
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Unable to sign in";
            setError(message);
            setIsAuthenticated(false);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await AuthService.logout();
        } catch {
            // ignore logout failures
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            router.push("/login");
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const value = useMemo(
        () => ({ user, isAuthenticated, loading, error, login, logout, checkAuth }),
        [user, isAuthenticated, loading, error]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }
    return context;
}
