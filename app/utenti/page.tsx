"use client"

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

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
    const router = useRouter();


    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await axios.get("http://localhost:4567/users/get", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.success) {
                    setUtenti(res.data.utenti);
                } else {
                    setError(res.data.message || "Errore nel caricamento utenti");
                }
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    router.push("/login");
                } else {
                    setError("Impossibile connettersi al server Ruby");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);
        const token = localStorage.getItem("token");

        const payload = {
            username: formData.get("username"),
            password: formData.get("password"),
            nome: formData.get("nome"),
            cognome: formData.get("cognome"),
            data_nascita: formData.get("data_nascita"),
        };

        try {
            const res = await axios.post("http://localhost:4567/users/register", payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (res.data.success) {
                alert("Utente aggiunto con successo!");
                form.reset();

                //Aggiunge il nuovo utente alla tabella
                const refreshRes = await axios.get("http://localhost:4567/users/get", {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (refreshRes.data.success) {
                    setUtenti(refreshRes.data.utenti);
                }
            } else {
                alert(res.data.message || "Errore durante la registrazione");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Errore di connessione al server Ruby");
        }
    };

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

            <div className="mt-5">
                <h5 className="text-center fw-bold mb-4" style={{ color: "#1C2024" }}>Aggiungi un nuovo utente</h5>
                <form id="form-create-user" className="row g-3" onSubmit={handleCreateUser}>
                    <div className="col-md-6">
                        <div className="">
                            <label htmlFor="inputUsername">Username <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                id="inputUsername"
                                name="username"
                                placeholder="Inserisci username"
                                required
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="">
                            <label htmlFor="inputPassword">Password <span className="text-danger">*</span></label>
                            <input
                                type="password"
                                className="form-control"
                                id="inputPassword"
                                name="password"
                                placeholder="Inserisci password"
                                required
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="">
                            <label htmlFor="inputNome">Nome</label>
                            <input
                                type="text"
                                className="form-control"
                                id="inputNome"
                                name="nome"
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="">
                            <label htmlFor="inputCognome">Cognome</label>
                            <input
                                type="text"
                                className="form-control"
                                id="inputCognome"
                                name="cognome"
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="">
                            <label htmlFor="inputDataNascita">Data di nascita</label>
                            <input
                                type="date"
                                className="form-control"
                                id="inputDataNascita"
                                name="data_nascita"
                            />
                        </div>
                    </div>
                    <div className="col-12 text-end">
                        <button type="submit" className="btn btn-primary">
                            Aggiungi Utente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}