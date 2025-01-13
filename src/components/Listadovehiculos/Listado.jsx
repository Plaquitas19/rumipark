import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

function Listado() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleString());
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("id");

    if (!userId) {
      navigate("/");
      return;
    }

    const fetchRegistros = async () => {
      try {
        const response = await axios.get(
          "https://CamiMujica.pythonanywhere.com/todos_registros",
          {
            headers: {
              "Content-Type": "application/json",
              id: userId,
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

  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(records);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Registros");
    writeFile(workbook, `registros_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Configurar encabezado y filas de la tabla
    const tableColumn = [
      "Placa",
      "Estado",
      "Fecha Entrada",
      "Hora Entrada",
      "Fecha Salida",
      "Hora Salida",
      "Observación",
    ];
    const tableRows = records.map((record) => [
      record.numero_placa,
      record.estado,
      record.fecha_entrada || "N/A",
      record.hora_entrada || "N/A",
      record.fecha_salida || "No registrada",
      record.hora_salida || "No registrada",
      record.observacion || "Sin observación",
    ]);

    // Añadir título al PDF
    doc.text("Listado de Entrada y Salida de Vehículos", 14, 10);

    // Configuración de autoTable
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    // Descargar el PDF con nombre dinámico
    doc.save(`registros_${new Date().toLocaleDateString()}.pdf`);
  };

  if (isLoading) {
    return <div className="text-center p-4">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 mx-auto max-w-full md:max-w-7xl">
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

      {/* Botones de exportación */}
      <div className="flex justify-end gap-4 mb-6">
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition duration-200"
        >
          <i className="fas fa-file-excel mr-2"></i> Exportar a Excel
        </button>
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition duration-200"
        >
          <i className="fas fa-file-pdf mr-2"></i> Exportar a PDF
        </button>
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
                  <span className="text-lg font-bold text-blue-800">
                    {record.numero_placa}
                  </span>
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
                    {record.fecha_salida
                      ? record.fecha_salida
                      : "No registrada"}
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
