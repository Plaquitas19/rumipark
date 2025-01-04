import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import VehicleTable from './VehicleTable';
import CameraSection from './CameraSection';

function MainContent() {
  const [estadoVehiculos, setEstadoVehiculos] = useState([]);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = now.toLocaleTimeString(); // Hora
      const date = now.toLocaleDateString(); // Fecha
      setCurrentTime(`${date} ${time}`); // Concatenar Fecha y Hora
    }, 1000);

    return () => clearInterval(interval); // Limpiar intervalo al desmontar componente
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('actualizar_estado', (data) => {
      setEstadoVehiculos((prevState) => [...prevState, data]);
    });

    return () => {
      socket.off('actualizar_estado');
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
          <span className="text-lg text-gray-600">{currentTime}</span> {/* Fecha y Hora en tiempo real */}
        </div>
        <CameraSection />
      </div>

      {/* Tabla de vehículos */}
      <div className="bg-white rounded-lg p-4 shadow-md">
        <h2 className="text-xl font-bold text-gray-700 text-center mb-4">Estado de Vehículos</h2>
        <VehicleTable estadoVehiculos={estadoVehiculos} />
      </div>
    </div>
  );
}

export default MainContent;
