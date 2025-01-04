import React, { useState } from "react";
import { Link } from "react-router-dom";  // Importa el componente Link
import logo from "../assets/logo.png";
import "font-awesome/css/font-awesome.min.css"; // Asegúrate de importar Font Awesome

function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="fixed top-0 left-0 h-screen w-[200px] sm:w-[230px] lg:w-[260px] bg-blue-900 text-white flex flex-col p-4 z-10">
      {/* Barra lateral más ancha y responsive */}
      <div className="flex flex-col items-center justify-center py-6">
        <img
          src={logo}
          alt="Logo"
          className="w-16 h-16 object-contain"  // Reducir tamaño del logo para que se ajuste al nuevo tamaño
        />
        <h1 className="text-lg sm:text-xl font-bold mt-4 text-center">RUMIPARK</h1> {/* Texto centrado */}
      </div>

      {/* Menu hamburguesa - Icono */}
      <button
        onClick={toggleMenu}
        className="lg:hidden text-white p-2 mt-4"
      >
        <i className="fa fa-bars text-2xl"></i>
      </button>

      <nav
        className={`flex flex-col text-xs sm:text-sm space-y-4 px-2 mt-4 ${isMenuOpen ? "block" : "hidden"} lg:block`} // Ajuste para móviles
      >
        {/* Enlace hacia la página de inicio */}
        <Link to="/" className="hover:bg-blue-700 p-2 rounded text-left text-xs sm:text-sm flex items-center">
          <i className="fa fa-home mr-3 text-lg"></i> Home
        </Link>

        {/* Enlace hacia la página de listado de vehículos */}
        <Link to="/listado" className="hover:bg-blue-700 p-2 rounded text-left text-xs sm:text-sm flex items-center">
          <i className="fa fa-list mr-3 text-lg"></i> Listado Entrada - Salida
        </Link>

        {/* Enlace hacia la página de usuarios */}
        <Link to="#" className="hover:bg-blue-700 p-2 rounded text-left text-xs sm:text-sm flex items-center">
          <i className="fa fa-users mr-3 text-lg"></i> Usuarios
        </Link>
      </nav>

      {/* Enlace de salir (ajustar acción dependiendo de tu lógica) */}
      <Link
        to="/logout"
        className="hover:bg-blue-700 p-2 rounded text-left text-xs sm:text-sm mt-auto flex items-center"
      >
        <i className="fa fa-sign-out mr-3 text-lg"></i> Salir
      </Link>
    </div>
  );
}

export default Sidebar;
