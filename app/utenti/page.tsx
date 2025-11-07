"use client"

import React, { useState, useEffect } from "react";

interface User {
    id: number;
    username: string;
    password: string;
    nome: string;
    cognome: string;
    data_nascita: string;
}

export default function UserPage() {
    const [utenti, setUtenti] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("http://localhost:4567/users/get");
                if (!res.ok) throw new Error("Errore nella risposta del server");

                const data = await res.json();

                if (data.success) {
                    setUtenti(data.utenti);
                } else {
                    setError(data.message || "Errore nel caricamento utenti");
                }
            } catch (err) {
                setError("Impossibile connettersi al server Ruby");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return (
        <div className="container my-5 p-4 rounded shadow-sm"
            style={{
                backgroundColor: "#ffffff",
                fontFamily: "Titillium Web, sans-serif",
                minHeight: "100vh",
            }}>
            <h1 className="text-center fw-bold mb-4"
                style={{
                    color: "#1C2024",
                    letterSpacing: "0.5px"
                }}>
                Gestione Utenti
            </h1>

            {loading && (
                <div className="alert alert-info" role="alert">
                    <p className="text-center text-secondary">Caricamento Utenti...</p>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    <p className="text-center text-danger">{error}</p>
                </div>
            )}

            {!loading && !error && utenti.length > 0 && (
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead className="table-light">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Username</th>
                                <th scope="col">Password</th>
                                <th scope="col">Nome</th>
                                <th scope="col">Cognome</th>
                                <th scope="col">Data di Nascita</th>
                            </tr>
                        </thead>
                        <tbody>
                            {utenti.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.password}</td>
                                    <td>{u.nome}</td>
                                    <td>{u.cognome}</td>
                                    <td>{u.data_nascita}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !error && utenti.length === 0 && (
                <div className="alert alert-warning" role="alert">
                    Nessun utente trovato.
                </div>
            )}
        </div>
    );
}