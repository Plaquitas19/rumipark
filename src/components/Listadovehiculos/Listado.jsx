import React, { useState, useEffect } from "react";
import axios from "axios";

function Listado() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleString()); // Reloj en formato de fecha y hora

  // Cargar los registros iniciales
  useEffect(() => {
    const fetchRegistros = async () => {
      try {
        const response = await axios.get(
          "https://CamiMujica.pythonanywhere.com/todos_registros" // Tu nueva ruta de la API
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

    // Actualizar el reloj cada segundo
    const intervalId = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);

    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return <div className="text-center p-4">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 mx-auto max-w-full md:max-w-7xl overflow-hidden">
      {/* Título y Reloj */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-blue-800 leading-tight">Listado de Entrada y Salida de Vehículos</h2>
        <div className="text-xl font-semibold text-gray-500">{time}</div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              <th className="text-left py-3 px-6 border-b">Placa</th>
              <th className="text-left py-3 px-6 border-b">Estado</th>
              <th className="text-left py-3 px-6 border-b">Fecha Entrada</th>
              <th className="text-left py-3 px-6 border-b">Hora Entrada</th>
              <th className="text-left py-3 px-6 border-b">Fecha Salida</th>
              <th className="text-left py-3 px-6 border-b">Hora Salida</th>
              <th className="text-left py-3 px-6 border-b">Observación</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map((record, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors duration-300`}
                >
                  <td className="py-3 px-6 border-b">{record.numero_placa}</td>
                  <td className="py-3 px-6 border-b">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${
                        record.estado === "Entrada"
                          ? "bg-green-200 text-green-800"
                          : "bg-orange-200 text-orange-800"
                      }`}
                    >
                      {record.estado}
                    </span>
                  </td>
                  <td className="py-3 px-6 border-b">{record.fecha_entrada}</td>
                  <td className="py-3 px-6 border-b">{record.hora_entrada}</td>
                  <td className="py-3 px-6 border-b">
                    {record.fecha_salida ? record.fecha_salida : "No registrada"}
                  </td>
                  <td className="py-3 px-6 border-b">
                    {record.hora_salida ? record.hora_salida : "No registrada"}
                  </td>
                  <td className="py-3 px-6 border-b">
                    {record.observacion || "Sin observación"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 border-b">
                  No hay registros disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Listado;
