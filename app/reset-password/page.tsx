"use client"

import { useState, useEffect, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get("token");

    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!token) {
            toast.error("Token mancante o non valido.");
        }
    }, [token]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!password) {
            toast.error("Inserisci una nuova password.");
            return;
        }

        setLoading(true);

        try {
            await axios.post("http://localhost:4567/users/reset-password", {
                token,
                new_password: password
            });

            toast.success("Password aggiornata con successo! Reindirizzamento...");

            setTimeout(() => router.push("/login"), 1800);
        } catch (err: any) {
            toast.error(
                err.response?.data?.message || "Errore durante il reset della password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "60px auto" }}>
            <h2>Reimposta la Password</h2>
            <p>Inserisci la tua nuova password</p>

            <form onSubmit={handleSubmit}>
                <label className="mt-3 d-block fw-bold">Nuova password:</label>
                <input
                    type="password"
                    className="form-control mt-1"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    type="submit"
                    className="btn btn-primary w-100 mt-4"
                    disabled={loading}
                >
                    {loading ? "Aggiornamento..." : "Reimposta Password"}
                </button>
            </form>
        </div>
    );
}