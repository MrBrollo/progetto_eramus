"use client"

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
    id: number;
    username: string;
    password: string;
    nome: string;
    cognome: string;
    data_nascita: string;
}

type SortKey = "id" | "username" | "nome" | "cognome" | "data_nascita" | null;
type SortOrder = "asc" | "desc";

export default function UserPage() {
    const [utenti, setUtenti] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [sortKey, setSortKey] = useState<SortKey>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const router = useRouter();


    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await axios.get(`http://localhost:4567/users/get?page=${page}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.success) {
                    setUtenti(res.data.utenti);
                    setTotalPages(res.data.total_pages);
                } else {
                    toast.error(res.data.message || "Errore nel caricamento utenti");
                }
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    router.push("/login");
                } else {
                    toast.error("Impossibile connettersi al server Ruby");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [page]);

    {/* --- ORDINE DEI CAMPI TABELLA --- */ }
    const sortData = (key: SortKey) => {
        if (!key) return;

        const newOrder = sortKey === key ? (sortOrder === "asc" ? "desc" : "asc") : "asc";

        const sorted = [...utenti].sort((a, b) => {
            let valA: any = a[key];
            let valB: any = b[key];

            if (key === "data_nascita") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else if (key === "id") {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = valA?.toString().toLowerCase();
                valB = valB?.toString().toLowerCase();
            }

            if (valA < valB) return newOrder === "asc" ? -1 : 1;
            if (valA > valB) return newOrder === "asc" ? 1 : -1;
            return 0;
        });

        setSortKey(key);
        setSortOrder(newOrder);
        setUtenti(sorted);
    };

    const getSortArrow = (key: SortKey) => {
        if (sortKey !== key) return null;
        return sortOrder === "asc" ? (
            <svg className="icon icon-sm ms-1">
                <use xlinkHref="/bootstrap-italia/svg/sprites.svg#it-arrow-up"></use>
            </svg>) : (
            <svg className="icon icon-sm ms-1">
                <use xlinkHref="/bootstrap-italia/svg/sprites.svg#it-arrow-down"></use>
            </svg>
        );
    };

    const getAriaSort = (key: SortKey) => {
        if (sortKey !== key) return "none";
        return sortOrder === "asc" ? "ascending" : "descending";
    };

    {/* --- AGGIUNGI NUOVO UTENTE --- */ }
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
                toast.success("Utente aggiunto con successo!");
                form.reset();

                //Aggiunge il nuovo utente alla tabella
                const refreshRes = await axios.get(`http://localhost:4567/users/get?page=${page}`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (refreshRes.data.success) {
                    setUtenti(refreshRes.data.utenti);
                }
            } else {
                toast.error(res.data.message || "Errore durante la registrazione");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Errore di connessione al server Ruby");
        }
    };

    {/* --- TABELLA GESTIONE UTENTI --- */ }
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

            {!loading && utenti.length > 0 && (
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead className="table-light">
                            <tr>
                                <th scope="col">
                                    <button
                                        className="btn btn-link p-0 text-decoration-none"
                                        onClick={() => sortData("id")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                sortData("id");
                                            }
                                        }}
                                        tabIndex={0}
                                        aria-sort={getAriaSort("id")}
                                        aria-label={
                                            sortKey === "id"
                                                ? `Ordina per id, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                                : "Ordina per id"
                                        }
                                    >
                                        ID {getSortArrow("id")}
                                    </button>
                                </th>

                                <th scope="col">
                                    <button
                                        className="btn btn-link p-0 text-decoration-none"
                                        onClick={() => sortData("username")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                sortData("username");
                                            }
                                        }}
                                        tabIndex={0}
                                        aria-sort={getAriaSort("username")}
                                        aria-label={
                                            sortKey === "username"
                                                ? `Ordina per username, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                                : "Ordina per username"
                                        }
                                    >
                                        Username {getSortArrow("username")}
                                    </button>
                                </th>

                                <th scope="col">
                                    <button
                                        className="btn btn-link p-0 text-decoration-none"
                                        onClick={() => sortData("nome")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                sortData("nome");
                                            }
                                        }}
                                        tabIndex={0}
                                        aria-sort={getAriaSort("nome")}
                                        aria-label={
                                            sortKey === "nome"
                                                ? `Ordina per nome, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                                : "Ordina per nome"
                                        }
                                    >
                                        Nome {getSortArrow("nome")}
                                    </button>
                                </th>

                                <th scope="col">
                                    <button
                                        className="btn btn-link p-0 text-decoration-none"
                                        onClick={() => sortData("cognome")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                sortData("cognome");
                                            }
                                        }}
                                        tabIndex={0}
                                        aria-sort={getAriaSort("cognome")}
                                        aria-label={
                                            sortKey === "cognome"
                                                ? `Ordina per cognome, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                                : "Ordina per cognome"
                                        }
                                    >
                                        Cognome {getSortArrow("cognome")}
                                    </button>
                                </th>

                                <th scope="col">
                                    <button
                                        className="btn btn-link p-0 text-decoration-none"
                                        onClick={() => sortData("data_nascita")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                sortData("data_nascita");
                                            }
                                        }}
                                        tabIndex={0}
                                        aria-sort={getAriaSort("data_nascita")}
                                        aria-label={
                                            sortKey === "data_nascita"
                                                ? `Ordina per data di nascita, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                                : "Ordina per data di nascita"
                                        }
                                    >
                                        Data di nascita {getSortArrow("data_nascita")}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {utenti.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.nome}</td>
                                    <td>{u.cognome}</td>
                                    <td>{new Date(u.data_nascita).toLocaleDateString("it-IT")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                    className="btn btn-primary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                >
                    Pagina precedente
                </button>

                <span className="fw-bold text-dark">
                    Pagina {page} di {totalPages}
                </span>

                <button
                    className="btn btn-primary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Pagina successiva
                </button>
            </div>

            {!loading && utenti.length === 0 && (
                <div className="alert alert-warning" role="alert">
                    Nessun utente trovato.
                </div>
            )}

            {/* --- FORM CREAZIONE UTENTE --- */}
            <div className="mt-5">
                <h2 className="text-center fw-bold mb-4" style={{ color: "#1C2024" }}>Aggiungi un nuovo utente</h2>
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