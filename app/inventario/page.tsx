"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Prodotto {
    id?: number;
    nome_oggetto: string;
    descrizione: string;
    data_inserimento?: string;
    tipo_prodotto_id: number;
}

export default function InventarioPage() {
    const [inventario, setInventario] = useState<Prodotto[]>([]);
    const [azione, setAzione] = useState("inserisci");
    const [formData, setFormData] = useState<Prodotto>({
        nome_oggetto: "",
        descrizione: "",
        tipo_prodotto_id: 1,
    });
    const [idModifica, setIdModifica] = useState<number | "">("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const tipiProdotto = [
        { id: 1, nome: "Buste" },
        { id: 2, nome: "Carta" },
        { id: 3, nome: "Toner" },
    ];

    useEffect(() => {
        const fetchInventario = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await axios.get("http://localhost:4567/inventario", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.success) {
                    setInventario(res.data.inventario);
                } else {
                    setError(res.data.message || "Errore nel caricamento dell'inventario");
                }
            } catch (err) {
                setError("Impossibile connettersi al server Ruby");
            }
        };

        fetchInventario();
    }, [router]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            if (azione === "inserisci") {
                await axios.post("http://localhost:4567/inventario", formData, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSuccess("Prodotto inserito con successo");
            } else if (azione === "modifica") {
                if (!idModifica) return setError("Inserisci l'ID del prodotto da modificare");
                await axios.put(`http://localhost:4567/inventario/${idModifica}`, formData, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSuccess("Prodotto modificato con successo");
            } else if (azione === "elimina") {
                if (!idModifica) return setError("Inserisci l'ID del prodotto da eliminare");
                await axios.delete(`http://localhost:4567/inventario/${idModifica}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSuccess("Prodotto eliminato con successo");
            }

            //Ricarica l'inventario
            const res = await axios.get("http://localhost:4567/inventario", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInventario(res.data.inventario);
            setFormData({
                nome_oggetto: "",
                descrizione: "",
                tipo_prodotto_id: 1
            });
            setIdModifica("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Errore durante l'operazione");
        }
    };

    return (
        <div className="container mt-5 shadow-box rounded p-4"
            style={{
                backgroundColor: "#ffffff",
                fontFamily: "Titillium Web, sans-serif",
                minHeight: "100vh",
            }}>
            <h1 className="mb-4 fw-bold text-center"
                style={{
                    color: "#1C2024",
                    letterSpacing: "0.5px"
                }}>
                Gestione Inventario</h1>

            {/* --- SELEZIONE AZIONE --- */}
            <div className="mb-4">
                <label className="form-label fw-bold">Seleziona azione:</label>
                <select
                    className="form-select"
                    value={azione}
                    onChange={(event) => setAzione(event.target.value)}
                >
                    <option value="inserisci">Inserisci prodotto</option>
                    <option value="modifica">Modifica prodotto</option>
                    <option value="elimina">Elimina prodotto</option>
                </select>
            </div>

            {/* --- FORM DINAMICO --- */}
            <form onSubmit={handleSubmit} className="mb-5 border rounded p-3 bg-light">
                {(azione === "modifica" || azione === "elimina") && (
                    <div className="mb-3">
                        <label className="form-label">ID Prodotto</label>
                        <input
                            type="number"
                            className="form-control"
                            value={idModifica}
                            onChange={(event) => setIdModifica(Number(event.target.value))}
                            required
                        />
                    </div>
                )}

                {azione !== "elimina" && (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Nome Oggetto</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.nome_oggetto}
                                onChange={(event) =>
                                    setFormData({ ...formData, nome_oggetto: event.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Descrizione</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.descrizione}
                                onChange={(event) =>
                                    setFormData({ ...formData, descrizione: event.target.value })
                                }
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Tipo Prodotto</label>
                            <select
                                className="form-select"
                                value={formData.tipo_prodotto_id}
                                onChange={(event) =>
                                    setFormData({ ...formData, tipo_prodotto_id: Number(event.target.value) })
                                }
                            >
                                {tipiProdotto.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <button type="submit" className="btn btn-primary">
                    {azione === "inserisci"
                        ? "Inserisci"
                        : azione === "modifica"
                            ? "Aggiorna"
                            : "Elimina"}
                </button>
            </form>

            {/* --- MESSAGGI DI ERRORE/SUCCESSO --- */}
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* --- TABELLA INVENTARIO --- */}
            <table className="table table-striped table-hover">
                <thead className="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nome Oggetto</th>
                        <th>Descrizione</th>
                        <th>Data Inserimento</th>
                        <th>Tipo Prodotto</th>
                    </tr>
                </thead>
                <tbody>
                    {inventario.length > 0 ? (
                        inventario.map((item: any) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.nome_oggetto}</td>
                                <td>{item.descrizione}</td>
                                <td>{new Date(item.data_inserimento).toLocaleDateString("it-IT")}</td>
                                <td>{item.tipo_prodotto}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="text-center">
                                Nessun prodotto presente in inventario.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}                            