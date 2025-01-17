import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import Listado from "./components/Listadovehiculos/Listado";
import Usuarios from "./components/Usuarios/Usuarios";
import PricingPlans from "./client/PricingPlans";
import Login from "./components/Login";
import { UserProvider } from "./components/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Ruta para Login */}
          <Route path="/login" element={<Login />} />

          {/* Ruta para Pricing Plans */}
          <Route path="/" element={<PricingPlans />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <div className="ml-[220px] sm:ml-[250px] lg:ml-[280px] w-full">
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