import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";

function VehicleTable() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem("id");

  // Conectar al WebSocket para actualizaciones en tiempo real
  const connectSocket = useCallback(() => {
    const socket = io("http://localhost:5000");

    socket.on("actualizar_registros", (nuevoRegistro) => {
      setVehicles((prevVehicles) => {
        const updatedVehicles = prevVehicles.filter(
          (v) => v.plate !== nuevoRegistro.numero_placa
        );

        // Agregar o actualizar registro
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

        return updatedVehicles.slice(0, 100); // Limitar a los 100 registros más recientes
      });
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    connectSocket(); // Conectar al WebSocket solo una vez
  }, [connectSocket]);

  // Cargar los registros iniciales
  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const response = await axios.get(
          "https://CamiMujica.pythonanywhere.com/registros",
          {
            headers: {
              id: userId, // Asegúrate de que este userId sea el del usuario autenticado
            },
          }
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
  }, [userId]);

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
            <th className="text-left py-2 px-4 border-b">
              <i className="fas fa-car-side mr-2"></i>Placa
            </th>
            <th className="text-left py-2 px-4 border-b">
              <i className="fas fa-info-circle mr-2"></i>Estado
            </th>
            <th className="text-left py-2 px-4 border-b">
              <i className="fas fa-calendar-day mr-2"></i>Fecha
            </th>
            <th className="text-left py-2 px-4 border-b">
              <i className="fas fa-clock mr-2"></i>Hora
            </th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length > 0 ? (
            vehicles.map((vehicle, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-blue-50"
                } hover:bg-blue-200 transition-colors duration-300`}
              >
                <td className="py-2 px-4 border-b flex items-center">
                  <i className="fas fa-car text-blue-500 mr-2"></i>
                  {vehicle.plate}
                </td>
                <td className="py-2 px-4 border-b">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-medium flex items-center ${
                      vehicle.status === "Entrada"
                        ? "bg-green-200 text-green-800"
                        : "bg-orange-200 text-orange-800"
                    }`}
                  >
                    <i
                      className={`mr-1 ${
                        vehicle.status === "Entrada"
                          ? "fas fa-arrow-circle-down"
                          : "fas fa-arrow-circle-up"
                      }`}
                    ></i>
                    {vehicle.status}
                  </span>
                </td>
                <td className="py-2 px-4 border-b flex items-center">
                  <i className="fas fa-calendar-alt text-blue-500 mr-2"></i>
                  {vehicle.date}
                </td>
                <td className="py-2 px-4 border-b flex items-center">
                  <i className="fas fa-clock text-green-500 mr-2"></i>
                  {vehicle.time}
                </td>
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
