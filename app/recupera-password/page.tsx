"use client"

import { useState, FormEvent } from "react";
import toast from "react-hot-toast";
import axios from "axios";

export default function RecuperaPasswordPage() {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Inserisci la tua email");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Inserisci un indirizzo email valido");
            return;
        }

        try {
            const res = await axios.post("http://localhost:4567/users/forgot-password", {
                email,
            });

            if (res.data.success) {
                toast.success("Email inviata! Controlla la tua casella di posta.");
            } else {
                toast.error(res.data.message || "Errore durante il recupero della password.");
            }
        } catch (err: any) {
            toast.error(
                err.response?.data?.message || "Errore di connessione al server."
            );
        }
    };

    return (
        <div className="it-page-section min-vh-100 d-flex align-items-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card shadow-lg-border-0">
                            <div className="card-body p-4">

                                <h1 className="h4 text-center mb-4 text-dark fw-bold">
                                    Recupera Password
                                </h1>

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label fw-semibold">
                                            Email <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Inserisci la tua email"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block w-100 mt-3"
                                    >
                                        Invia richiesta
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}