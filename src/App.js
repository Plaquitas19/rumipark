import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // Uso de Routes en lugar de Switch
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import ListadoPage from "./components/Listadovehiculos/Listado";
import toastr from "toastr";
import "toastr/build/toastr.min.css"; // Estilos de Toastr

// Configuración global de Toastr
toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right", // Posición de la notificación
  timeOut: 3000, // Duración en milisegundos
  extendedTimeOut: 1000, // Tiempo extra al pasar el cursor
  showMethod: "fadeIn", // Animación al aparecer
  hideMethod: "fadeOut", // Animación al desaparecer
};

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Menú lateral fijo */}
        <Sidebar />
        {/* Contenido principal con margen para respetar el sidebar fijo */}
        <div className="ml-[220px] sm:ml-[250px] lg:ml-[280px] w-full">
          <Routes> {/* Usamos Routes en lugar de Switch */}
            <Route path="/" element={<MainContent />} /> {/* Elemento ahora pasa como prop */}
            <Route path="/listado" element={<ListadoPage />} />
            {/* Agrega más rutas según las páginas de tu aplicación */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;