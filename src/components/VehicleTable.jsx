import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

function VehicleTable() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Conectar al WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io("http://localhost:5000");

    // Escuchar actualizaciones
    socket.on("actualizar_registros", (nuevoRegistro) => {
      setVehicles((prevVehicles) => {
        const updatedVehicles = [...prevVehicles];
        const existingIndex = updatedVehicles.findIndex(
          (v) => v.plate === nuevoRegistro.numero_placa
        );

        // Actualizar si ya existe, si no agregar
        if (existingIndex > -1) {
          updatedVehicles[existingIndex] = {
            ...updatedVehicles[existingIndex],
            ...nuevoRegistro,
          };
        } else {
          updatedVehicles.push({
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

        return updatedVehicles;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Cargar los registros iniciales
  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const response = await axios.get(
          "https://CamiMujica.pythonanywhere.com/registros"
        );
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
        setIsLoading(false);
      } catch (error) {
        setError("Error al obtener los registros. Intente nuevamente.");
        setIsLoading(false);
      }
    };

    fetchRegistros();
  }, []);

  if (isLoading) {
    return <div className="text-center p-4">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mx-auto max-w-full overflow-hidden">
      <table className="table-auto w-full text-sm text-gray-700">
        <thead>
          <tr className="bg-blue-50 text-blue-800">
            <th className="text-left py-2 px-4 border-b">Placa</th>
            <th className="text-left py-2 px-4 border-b">Estado</th>
            <th className="text-left py-2 px-4 border-b">Fecha</th>
            <th className="text-left py-2 px-4 border-b">Hora</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length > 0 ? (
            vehicles.map((vehicle, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50"} hover:bg-blue-200 transition-colors duration-300`}
              >
                <td className="py-2 px-4 border-b">{vehicle.plate}</td>
                <td className="py-2 px-4 border-b">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                      vehicle.status === "Entrada"
                        ? "bg-green-200 text-green-800"
                        : "bg-orange-200 text-orange-800"
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">{vehicle.date}</td>
                <td className="py-2 px-4 border-b">{vehicle.time}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-4 border-b">
                No hay registros disponibles.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default VehicleTable;
