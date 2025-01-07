import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import Listado from "./components/Listadovehiculos/Listado";
import Login from "./components/Login";
import { UserProvider } from "./components/UserContext"; // Importa el UserProvider

function App() {
  return (
    <UserProvider> {/* Envolver en UserProvider */}
      <Router>
        <Routes>
          {/* Ruta para Login */}
          <Route path="/" element={<Login />} />

          {/* Ruta protegida */}
          <Route
            path="/dashboard/*"
            element={
              <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <div className="ml-[220px] sm:ml-[250px] lg:ml-[280px] w-full">
                  <Routes>
                    <Route path="main" element={<MainContent />} />
                    <Route path="listado" element={<Listado />} />
                  </Routes>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;