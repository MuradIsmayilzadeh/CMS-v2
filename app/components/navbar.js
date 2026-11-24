"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => setIsAdmin(Boolean(Cookies.get("adminToken"))), []);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="brand"><span className="brand-mark">{"</>"}</span> CMS v2</Link>
        <div className="nav-links">
          <Link href="/" className="btn btn-ghost">Contests</Link>
          <Link href={isAdmin ? "/admin-dashboard" : "/adminlogin"} className="btn">{isAdmin ? "Dashboard" : "Admin login"}</Link>
        </div>
      </div>
    </nav>
  );
}
