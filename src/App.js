import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import Listado from "./components/Listadovehiculos/Listado";
import Usuarios from "./components/Usuarios/Usuarios";
import Login from "./components/Login";
import { UserProvider } from "./components/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = (isOpen) => {
    setIsSidebarOpen(isOpen);
  };

  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Ruta para Login */} 
          <Route path="/login" element={<Login />} />

          {/* Ruta por defecto ahora apunta al Login */}
          <Route
            path="/"
            element={<Login />} 
          />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar onToggleSidebar={handleToggleSidebar} />
                  <div
                    className={`transition-all duration-300 ${
                      isSidebarOpen ? "ml-[200px] sm:ml-[230px] lg:ml-[260px]" : "ml-0"
                    } w-full`}
                  >
                    <Routes>
                      <Route path="main" element={<MainContent />} />
                      <Route path="listado" element={<Listado />} />
                      <Route path="usuarios" element={<Usuarios />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
