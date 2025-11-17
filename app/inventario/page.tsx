"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

interface Prodotto {
    id?: number;
    nome_oggetto: string;
    descrizione: string;
    data_inserimento?: string;
    tipo_prodotto_id: number;
}

type SortKey = "id" | "nome_oggetto" | "descrizione" | "data_inserimento" | "tipo_prodotto_id" | null;
type SortOrder = "asc" | "desc";

export default function InventarioPage() {
    const [inventario, setInventario] = useState<Prodotto[]>([]);
    const [editId, setEditId] = useState<number | null>(null);
    const [azione, setAzione] = useState<"inserisci" | "modifica">("inserisci");
    const [formData, setFormData] = useState<Prodotto>({
        nome_oggetto: "",
        descrizione: "",
        tipo_prodotto_id: 1,
    });
    const router = useRouter();
    const [sortKey, setSortKey] = useState<SortKey>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const tipiProdotto = [
        { id: 1, nome: "Buste" },
        { id: 2, nome: "Carta" },
        { id: 3, nome: "Toner" },
    ];

    const sortData = (key: SortKey) => {
        if (!key) return;

        const newOrder = sortKey === key ? (sortOrder === "asc" ? "desc" : "asc") : "asc";

        const sorted = [...inventario].sort((a, b) => {
            let valA: any = a[key];
            let valB: any = b[key];

            if (key === "data_inserimento") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else if (key === "id" || key === "tipo_prodotto_id") {
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
        setInventario(sorted);
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

    {/* --- CARICAMENTO INVENTARIO --- */ }
    const fetchInventario = async (page = 1) => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const res = await axios.get(`http://localhost:4567/inventario?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                setInventario(res.data.inventario);
                setCurrentPage(res.data.page);
                setTotalPages(res.data.total_pages);
            } else {
                toast.error(res.data.message || "Errore nel caricamento dell'inventario");
            }
        } catch (err) {
            toast.error("Impossibile connettersi al server Ruby");
        }
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        fetchInventario(currentPage);
    }, [currentPage]);

    {/* --- SUBMIT FORM --- */ }
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        try {
            if (editId === null) {

                await axios.post("http://localhost:4567/inventario", formData, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                toast.success("Prodotto inserito con successo");
            } else {
                await axios.put(`http://localhost:4567/inventario/${editId}`, formData, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                toast.success("Prodotto modificato con successo");
            }

            setFormData({
                nome_oggetto: "",
                descrizione: "",
                tipo_prodotto_id: 1
            });
            setEditId(null);

            fetchInventario();

        } catch (err: any) {
            toast.error(err.response?.data?.message || "Errore durante l'operazione")
        }
    };

    {/* --- FUNZIONE DI ELIMINAZIONE PRODOTTO --- */ }
    const handleDelete = async (id: number) => {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");

        if (!confirm("Sei sicuro di voler eliminare questo prodotto?")) return;

        try {
            await axios.delete(`http://localhost:4567/inventario/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Prodotto eliminato con successo");
            fetchInventario();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Errore durante l'eliminazione");
        }
    };

    {/* --- FUNZIONE DI MODIFICA PRODOTTO ---*/ }
    const handleEdit = (prodotto: Prodotto) => {
        if (azione === "modifica" && editId === prodotto.id) {
            setAzione("inserisci");
            setEditId(null);
            setFormData({
                nome_oggetto: "",
                descrizione: "",
                tipo_prodotto_id: 1,
            });
            return;
        }

        setAzione("modifica");
        setEditId(prodotto.id || null);
        setFormData({
            nome_oggetto: prodotto.nome_oggetto,
            descrizione: prodotto.descrizione,
            tipo_prodotto_id: Number(prodotto.tipo_prodotto_id) || 1,
        });
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

            {/* --- TABELLA INVENTARIO --- */}
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
                                onClick={() => sortData("nome_oggetto")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        sortData("nome_oggetto");
                                    }
                                }}
                                tabIndex={0}
                                aria-sort={getAriaSort("nome_oggetto")}
                                aria-label={
                                    sortKey === "nome_oggetto"
                                        ? `Ordina per nome oggetto, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                        : "Ordina per nome oggetto"
                                }
                            >
                                Nome Oggetto {getSortArrow("nome_oggetto")}
                            </button>
                        </th>

                        <th scope="col">
                            <button
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => sortData("descrizione")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        sortData("descrizione");
                                    }
                                }}
                                tabIndex={0}
                                aria-sort={getAriaSort("descrizione")}
                                aria-label={
                                    sortKey === "descrizione"
                                        ? `Ordina per descrizione, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                        : "Ordina per descrizione"
                                }
                            >
                                Descrizione {getSortArrow("descrizione")}
                            </button>
                        </th>

                        <th scope="col">
                            <button
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => sortData("data_inserimento")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        sortData("data_inserimento");
                                    }
                                }}
                                tabIndex={0}
                                aria-sort={getAriaSort("data_inserimento")}
                                aria-label={
                                    sortKey === "data_inserimento"
                                        ? `Ordina per data inserimento, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                        : "Ordina per data inserimento"
                                }
                            >
                                Data Inserimento {getSortArrow("data_inserimento")}
                            </button>
                        </th>

                        <th scope="col">
                            <button
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => sortData("tipo_prodotto_id")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        sortData("tipo_prodotto_id");
                                    }
                                }}
                                tabIndex={0}
                                aria-sort={getAriaSort("tipo_prodotto_id")}
                                aria-label={
                                    sortKey === "tipo_prodotto_id"
                                        ? `Ordina per tipo prodotto, ordine ${sortOrder === "asc" ? "crescente" : "descrescente"}`
                                        : "Ordina per tipo prodotto"
                                }
                            >
                                Tipo Prodotto {getSortArrow("tipo_prodotto_id")}
                            </button>
                        </th>
                        <th scope="col">
                            <span className="visually-hidden">Azioni</span>
                        </th>
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
                                <td className="text-end">

                                    {/* --- PULSANTI MODIFICA/ELIMINA --- */}
                                    <button
                                        className="btn btn-sm me-2"
                                        onClick={() => handleEdit(item)}
                                        title="Modifica"
                                    >
                                        <svg className="icon icon-sm">
                                            <use xlinkHref="/bootstrap-italia/svg/sprites.svg#it-pencil"></use>
                                        </svg>
                                    </button>

                                    <button
                                        className="btn btn-sm"
                                        onClick={() => handleDelete(item.id)}
                                        title="Elimina"
                                    >
                                        <svg className="icon icon-sm">
                                            <use xlinkHref="/bootstrap-italia/svg/sprites.svg#it-delete"></use>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="text-center">
                                Nessun prodotto in inventario.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="d-flex justify-content-center align-items-center my-3">

                {/* PREVIOUS */}
                <button
                    className="btn btn-sm btn-primary mx-1"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                >
                    Pagina precedente
                </button>

                {/* NUMBERS */}
                {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                        <button
                            key={page}
                            className={`btn btn-sm mx-1 ${currentPage === page
                                ? "btn-primary"
                                : "btn-outline-secondary"
                                }`}
                            onClick={() => goToPage(page)}
                        >
                            {page}
                        </button>
                    );
                })}

                {/* NEXT */}
                <button
                    className="btn btn-sm btn-primary mx-1"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                >
                    Pagina successiva
                </button>
            </div>

            {/* --- FORM INSERIMENTO / MODIFICA --- */}
            <form onSubmit={handleSubmit} className="mb-5 border rounded p-3 bg-light">

                <h2 className="fw-bold text-center mb-3"
                    style={{ color: "#1C2024" }}>
                    {azione === "modifica" ? "Modifica prodotto" : "Inserisci nuovo prodotto"}
                </h2>

                <div className="mb-3">
                    <label htmlFor="nome_oggetto" className="form-label">Nome Oggetto</label>
                    <input
                        type="text"
                        className="form-control"
                        id="nome_oggetto"
                        value={formData.nome_oggetto}
                        onChange={(e) => setFormData({ ...formData, nome_oggetto: e.target.value })}
                        required
                    />
                </div>


                <div className="mb-3">
                    <label htmlFor="descrizione" className="form-label">Descrizione</label>
                    <input
                        type="text"
                        className="form-control"
                        id="descrizione"
                        value={formData.descrizione}
                        onChange={(e) =>
                            setFormData({ ...formData, descrizione: e.target.value })
                        }
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="tipo_prodotto" className="form-label">Tipo Prodotto</label>
                    <select
                        className="form-select"
                        value={String(formData.tipo_prodotto_id ?? "")}
                        id="tipo_prodotto"
                        onChange={(e) =>
                            setFormData({ ...formData, tipo_prodotto_id: Number(e.target.value) })
                        }
                    >
                        {tipiProdotto.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>
                                {tipo.nome}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="btn btn-primary w-100">
                    {azione === "modifica" ? "Aggiorna" : "Inserisci"}
                </button>
            </form>
        </div >
    );
}