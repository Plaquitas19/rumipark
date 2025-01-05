import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

export const VehicleContext = createContext();

export const VehicleProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);

  // Función para cargar vehículos desde la API
  const fetchVehicles = async () => {
    try {
      const response = await axios.get("https://CamiMujica.pythonanywhere.com/registros");
      const registros = response.data.registros || [];
      const vehicleData = registros.map((registro) => ({
        plate: registro.numero_placa,
        status:
          registro.fecha_salida === null || registro.hora_salida === null
            ? "Entrada"
            : "Salida",
        date:
          registro.fecha_salida === null
            ? registro.fecha_entrada
            : registro.fecha_salida,
        time:
          registro.hora_salida === null
            ? registro.hora_entrada
            : registro.hora_salida,
      }));
      setVehicles(vehicleData);
    } catch (error) {
      console.error("Error al obtener los registros:", error);
    }
  };

  // Escuchar cambios en tiempo real con WebSocket
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("actualizar_registros", (nuevoRegistro) => {
      setVehicles((prevVehicles) => {
        const updatedVehicles = [...prevVehicles];
        const existingIndex = updatedVehicles.findIndex(
          (v) => v.plate === nuevoRegistro.numero_placa
        );

        if (existingIndex > -1) {
          updatedVehicles[existingIndex] = {
            ...updatedVehicles[existingIndex],
            ...nuevoRegistro,
          };
        } else {
          updatedVehicles.unshift({
            plate: nuevoRegistro.numero_placa,
            status:
              nuevoRegistro.fecha_salida === null ||
              nuevoRegistro.hora_salida === null
                ? "Entrada"
                : "Salida",
            date:
              nuevoRegistro.fecha_salida === null
                ? nuevoRegistro.fecha_entrada
                : nuevoRegistro.fecha_salida,
            time:
              nuevoRegistro.hora_salida === null
                ? nuevoRegistro.hora_entrada
                : nuevoRegistro.hora_salida,
          });
        }

        return updatedVehicles.slice(0, 100);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <VehicleContext.Provider value={{ vehicles, fetchVehicles }}>
      {children}
    </VehicleContext.Provider>
  );
};