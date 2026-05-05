"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { useAuth } from "../_components/AuthContext";

const LoginPage = () => {
    const router = useRouter();
    const { login, isAuthenticated, loading } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthenticated, loading, router]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        try {
            await login(username.trim(), password);
            router.replace("/");
        } catch (error: any) {
            setFormError(error?.message || "Invalid credentials");
        }
    };

    return (
        <div className="container mx-auto max-w-md py-12 px-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="loginUsername">
                        <Form.Label>Username or email</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter your username or email"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            disabled={loading}
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="loginPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={loading}
                        />
                    </Form.Group>

                    <Button type="submit" disabled={loading || !username || !password} className="w-full">
                        {loading ? "Signing in..." : "Sign in"}
                    </Button>
                </Form>

                {formError ? <div className="mt-3 text-danger">{formError}</div> : null}
            </div>
        </div>
    );
};

export default LoginPage;
