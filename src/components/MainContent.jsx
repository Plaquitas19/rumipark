import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import VehicleTable from "./VehicleTable";
import CameraSection from "./CameraSection";

function MainContent() {
  const [estadoVehiculos, setEstadoVehiculos] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [saludo, setSaludo] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si existe un auth_token en localStorage
    if (!localStorage.getItem("auth_token")) {
      navigate("/"); // Redirige al login si no hay token
    }

    // Obtener el username desde localStorage
    const usuarioUsername = localStorage.getItem("username");
    setUsername(usuarioUsername);

    // Función para obtener la hora actual en Perú y ajustar el saludo
    const obtenerHoraPeru = () => {
      const ahora = new Date().toLocaleString("en-US", {
        timeZone: "America/Lima",
        hour12: false, // Hora en formato de 24 horas
        hour: "2-digit",
        minute: "2-digit",
      });

      const hora = parseInt(ahora.split(":")[0]);
      if (hora >= 0 && hora < 12) {
        setSaludo("Buenos días");
      } else if (hora >= 12 && hora < 18) {
        setSaludo("Buenas tardes");
      } else {
        setSaludo("Buenas noches");
      }
    };

    // Ejecutar la función al cargar
    obtenerHoraPeru();
    // Actualizar el saludo cada minuto
    const saludoInterval = setInterval(obtenerHoraPeru, 60000);

    return () => clearInterval(saludoInterval);
  }, [navigate]);

  useEffect(() => {
    // Actualizar la hora y fecha cada segundo
    const interval = setInterval(() => {
      const ahora = new Date().toLocaleString("es-PE", {
        timeZone: "America/Lima",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour12: false, // Hora de 24 horas
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(ahora);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("actualizar_estado", (data) => {
      setEstadoVehiculos((prevState) => [...prevState, data]);
    });

    return () => {
      socket.off("actualizar_estado");
      socket.close();
    };
  }, []);

  return (
    <div className="w-full p-6">
      <header className="text-blue-900 text-lg font-bold mb-4">
        {saludo}, {username ? username : "Usuario"}
      </header>

      <div className="bg-gray-200 rounded-lg p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">
            Detección de Placas
          </h2>
          <div className="flex items-center text-lg text-gray-600">
            <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
            <span className="mr-4">{currentTime.split(",")[0]}</span>
            <i className="fas fa-clock mr-2 text-green-600"></i>
            <span>{currentTime.split(",")[1]}</span>
          </div>
        </div>
        <CameraSection />
      </div>

      <div className="bg-white rounded-lg p-4 shadow-md">
        <h2 className="text-xl font-bold text-gray-700 text-center mb-4">
          Estado de Vehículos
        </h2>
        <VehicleTable estadoVehiculos={estadoVehiculos} />
      </div>
    </div>
  );
}

export default MainContent;
