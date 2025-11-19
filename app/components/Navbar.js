"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
            <div className="container-fluid">
                <Link className="navbar-brand fw-semibold text-primary" href="/">
                    Gestione App
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-controls="navbarSupportedContent"
                    aria-expanded={isOpen ? "true" : "false"}
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div
                    className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}
                    id="navbarSupportedContent"
                >
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link
                                className="nav-link text-dark fw-medium"
                                href="/utenti"
                                onClick={() => setIsOpen(false)}
                            >
                                <svg className="icon icon-sm ms-1">
                                    <use xlinkHref="/bootstrap-italia/svg/sprites.svg#it-user"></use>
                                </svg>
                                Gestione Utenti
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className="nav-link text-dark fw-medium"
                                href="/inventario"
                                onClick={() => setIsOpen(false)}
                            >
                                <svg className="icon icon-sm ms-1">
                                    <use xlinkHref="/bootstrap-italia/svg/sprites.svg#it-tool"></use>
                                </svg>
                                Gestione Inventario
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}