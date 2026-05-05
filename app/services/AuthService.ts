import api from "./api";

interface LoginPayload {
    username: string;
    password: string;
}

interface LoginResponse {
    message?: string;
    user?: { id: number; name: string; email?: string };
}

const login = (username: string, password: string) => {
    const payload: LoginPayload = { username, password };
    return api.post<LoginResponse>("auth/login", payload, { withCredentials: true });
};

const logout = () => {
    return api.post("auth/logout", {}, { withCredentials: true });
};

const getMe = () => {
    return api.get<{ user: { id: number; name: string; email?: string } }>("auth/me", { withCredentials: true });
};

const AuthService = {
    login,
    logout,
    getMe,
};

export default AuthService;
