"use client";

import React, { useState } from "react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch("http://localhost:4567//login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        alert(data.message);

        //validazione dei campi obbligatori
        if (!username || !password) {
            setError("Compilare tutti i campi obbligatori.");
            return;
        }

        //Validazione password secondo linee guida Agid
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\d\s:]).{8,}$/;

        if (!passwordRegex.test(password)) {
            setError("La password deve contenere almeno 8 caratteri, una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale."
            );
            return;
        }

        alert(`Login eseguito come ${username}`);
        setError("");
    };

    return (
        <div className="it-page-section min-vh-100 d-flex align-items-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card shadow-lg border-0">
                            <div className="card-body p-4">
                                <h1 className="h4 text-center mb-4 text-dark fw-bold">Login</h1>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="mb-3">
                                        <label htmlFor="username" className="form-label fw-semibold d-block">
                                            Username <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="username"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Inserisci il tuo username"
                                            aria-describedby="usernameHelp"
                                        />
                                        <small id="usernameHelp" className="form-text text-muted">
                                            Inserisci il tuo username.
                                        </small>
                                    </div>

                                    <div className=" mb-3">
                                        <label htmlFor="password" className="form-label fw-semibold">
                                            Password <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            aria-describedby="passwordHelp"
                                            placeholder="Inserisci la tua password"
                                        />
                                        <small id="passwordHelp" className="form-text text-muted d-block">
                                            Deve contenere almeno 8 caratteri, una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale.
                                        </small>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block w-100 mt-3"
                                    >
                                        Accedi
                                    </button>
                                </form>
                            </div>
                        </div>

                        <p className="text-center mt-3 text-muted small">
                            Accesso riservato - conforme alle linee guida Agid.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}