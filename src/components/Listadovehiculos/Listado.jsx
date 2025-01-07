import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Listado() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleString());
  const navigate = useNavigate(); // Usamos el hook para redirigir al usuario si no está autenticado

  useEffect(() => {
    // Verificamos si hay un token de autenticación
    const userId = localStorage.getItem("id"); // Asegúrate de almacenar el ID del usuario cuando se autentique

    if (!userId) {
      navigate("/"); // Redirige al login si no hay ID
      return;
    }

    const fetchRegistros = async () => {
      try {
        const response = await axios.get(
          "https://CamiMujica.pythonanywhere.com/todos_registros",
          {
            headers: {
              "Content-Type": "application/json",
              id: userId, // Enviamos el ID del usuario autenticado en el header
            },
          }
        );
        const registros = response.data.registros || [];
        setRecords(registros);
        setIsLoading(false);
      } catch (error) {
        setError("Error al obtener los registros. Intente nuevamente.");
        setIsLoading(false);
      }
    };

    fetchRegistros();

    const intervalId = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  if (isLoading) {
    return <div className="text-center p-4">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 mx-auto max-w-full md:max-w-7xl">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-blue-800 leading-tight flex items-center">
          <i className="fas fa-list-alt mr-3 text-blue-600"></i>
          Listado de Entrada y Salida de Vehículos
        </h2>
        <div className="text-xl font-semibold text-gray-500 flex items-center">
          <i className="fas fa-clock mr-2 text-green-600"></i>
          {time}
        </div>
      </div>

      {/* Listado de Registros */}
      <div className="space-y-6">
        {records.length > 0 ? (
          records.map((record, index) => (
            <div
              key={index}
              className="bg-blue-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <i className="fas fa-car-side text-blue-500 text-xl mr-2"></i>
                  <span className="text-lg font-bold text-blue-800">{record.numero_placa}</span>
                </div>
                <div
                  className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                    record.estado === "Entrada"
                      ? "bg-green-200 text-green-800"
                      : "bg-orange-200 text-orange-800"
                  }`}
                >
                  <i
                    className={`mr-1 ${
                      record.estado === "Entrada"
                        ? "fas fa-arrow-circle-down"
                        : "fas fa-arrow-circle-up"
                    }`}
                  ></i>
                  {record.estado}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-center">
                  <i className="fas fa-calendar-day text-blue-500 mr-2"></i>
                  <span>
                    <strong>Fecha Entrada:</strong> {record.fecha_entrada}
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-clock text-green-500 mr-2"></i>
                  <span>
                    <strong>Hora Entrada:</strong> {record.hora_entrada}
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-calendar-check text-blue-500 mr-2"></i>
                  <span>
                    <strong>Fecha Salida:</strong>{" "}
                    {record.fecha_salida ? record.fecha_salida : "No registrada"}
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-clock text-green-500 mr-2"></i>
                  <span>
                    <strong>Hora Salida:</strong>{" "}
                    {record.hora_salida ? record.hora_salida : "No registrada"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <i className="fas fa-comment-alt text-gray-500 mr-2"></i>
                  <span>
                    <strong>Observación:</strong>{" "}
                    {record.observacion || "Sin observación"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            No hay registros disponibles.
          </div>
        )}
      </div>
    </div>
  );
}

export default Listado;
