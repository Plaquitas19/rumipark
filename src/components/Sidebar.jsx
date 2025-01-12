import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/icono.png";
import "font-awesome/css/font-awesome.min.css";

function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem("auth_token"); // Elimina el token para cerrar sesión
    navigate("/"); // Redirige al inicio de sesión
  };

  return (
    <div>
      {/* Barra lateral */}
      <div
        className={`fixed top-0 left-0 h-screen w-[200px] sm:w-[230px] lg:w-[260px] bg-[#1da4cf] text-white flex flex-col justify-between p-4 z-10 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300`}
      >
        {/* Contenido superior */}
        <div>
          {/* Contenedor del logo */}
          <div className="flex flex-col items-center justify-center py-6">
            <img src={logo} alt="Logo" className="w-25 h-25 object-contain" />
          </div>

          {/* Navegación del menú */}
          <nav className="flex flex-col text-xs sm:text-sm space-y-4 px-2 mt-4">
            <Link
              to="/dashboard/main"
              className="hover:bg-[#167f9f] p-2 rounded text-left text-xs sm:text-sm flex items-center"
            >
              <i className="fa fa-home mr-3 text-lg"></i> Home
            </Link>

            <Link
              to="/dashboard/listado"
              className="hover:bg-[#167f9f] p-2 rounded text-left text-xs sm:text-sm flex items-center"
            >
              <i className="fa fa-list mr-3 text-lg"></i> Listado Entrada -
              Salida
            </Link>

            <Link
              to="#"
              className="hover:bg-[#167f9f] p-2 rounded text-left text-xs sm:text-sm flex items-center"
            >
              <i className="fa fa-users mr-3 text-lg"></i> Usuarios
            </Link>
          </nav>
        </div>

        {/* Botón "Salir" posicionado al fondo */}
        <div className="mt-auto">
          <Link
            to="#"
            onClick={handleLogout} // Lógica de cierre de sesión
            className="hover:bg-[#167f9f] p-2 rounded text-left text-xs sm:text-sm flex items-center"
          >
            <i className="fa fa-sign-out mr-3 text-lg"></i> Salir
          </Link>
        </div>
      </div>

      {/* Menú hamburguesa */}
      <button
        onClick={toggleMenu}
        className={`lg:hidden text-2xl p-2 mt-4 absolute top-4 left-4 z-20 ${
          isMenuOpen ? "text-white" : "text-[#167f9f]"
        }`}
      >
        <i className="fa fa-bars"></i>
      </button>
    </div>
  );
}

export default Sidebar;
