import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import VehicleTable from "./VehicleTable";
import CameraSection from "./CameraSection";

function MainContent() {
  const [estadoVehiculos, setEstadoVehiculos] = useState([]);
  const [currentTime, setCurrentTime] = useState(""); // Estado para la fecha y hora en tiempo real

  useEffect(() => {
    // Actualizar la hora y fecha cada segundo
    const interval = setInterval(() => {
      const now = new Date();
      const time = now.toLocaleTimeString(); // Obtener la hora en formato local
      const date = now.toLocaleDateString(); // Obtener la fecha en formato local
      setCurrentTime(`${date} ${time}`); // Actualizar el estado con la fecha y hora concatenadas
    }, 1000);

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
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
      {/* Encabezado */}
      <header className="text-blue-900 text-lg font-bold mb-4">
        Buenas tardes, José Pedro
      </header>

      {/* Sección de detección de placas */}
      <div className="bg-gray-200 rounded-lg p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Detección de Placas</h2>
          {/* Fecha y Hora en Tiempo Real */}
          <div className="flex items-center text-lg text-gray-600">
            <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
            <span className="mr-4">{currentTime.split(" ")[0]}</span>
            <i className="fas fa-clock mr-2 text-green-600"></i>
            <span>{currentTime.split(" ")[1]}</span>
          </div>
        </div>
        <CameraSection />
      </div>

      {/* Tabla de vehículos */}
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