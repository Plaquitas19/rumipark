import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../../assets/icono.png";

function Listado() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleString());
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [observacion, setObservacion] = useState("");
  const navigate = useNavigate();
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("id");

    if (!userId) {
      toast.error(
        "No se encontró el ID del usuario. Inicia sesión nuevamente."
      );
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
        setFilteredRecords(registros);
        setIsLoading(false);
      } catch (error) {
        console.error("Error al obtener los registros:", error);
        setError("Error al obtener los registros. Intente nuevamente.");
        setIsLoading(false);
        toast.error("Error al obtener los registros. Intente nuevamente.");
      }
    };

    fetchRegistros();

    const intervalId = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query) {
      const filtered = records.filter((record) =>
        record.numero_placa.toLowerCase().includes(query)
      );
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(records);
    }
  };

  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(records);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Registros");
    writeFile(workbook, `registros_${new Date().toLocaleDateString()}.xlsx`);
    toast.success("Exportado a Excel con éxito");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.addImage(logo, "PNG", 10, 10, 30, 30);
    doc.setFontSize(16);
    doc.setTextColor("#167f9f");
    doc.text("Listado de Entrada y Salida de Vehículos", 50, 25);

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

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      styles: {
        fillColor: "#f2f2f2",
        textColor: "#333333",
        lineColor: "#cccccc",
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: "#167f9f",
        textColor: "#ffffff",
        fontSize: 12,
        halign: "center",
      },
      bodyStyles: {
        textColor: "#000000",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: "#e9f7fd",
      },
      margin: { top: 60 },
      theme: "grid",
    });

    doc.save(`listado_vehiculos_${new Date().toLocaleDateString()}.pdf`);
    toast.success("Exportado a PDF con éxito");
  };

  const handleSelectRecord = (record) => {
    console.log("Registro seleccionado:", record);
    setSelectedRecord(record);
    setObservacion(record.observacion || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setObservacion("");
  };

  const handleObservacionChange = (e) => {
    setObservacion(e.target.value);
  };

  const handleSaveObservacion = async () => {
    try {
      const userId = localStorage.getItem("id");
      if (!userId) {
        toast.error(
          "El ID del usuario no fue encontrado. Por favor, inicia sesión."
        );
        return;
      }

      const registroId = selectedRecord?.id;
      if (!registroId) {
        console.error(
          "Error: selectedRecord no contiene un id válido:",
          selectedRecord
        );
        toast.error("No se encontró el registro seleccionado.");
        return;
      }

      const payload = {
        registro_id: registroId,
        observacion: observacion.trim(),
      };

      console.log("Payload enviado al backend:", payload);

      const response = await axios.post(
        "https://CamiMujica.pythonanywhere.com/registrar_observacion",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            id: userId,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Observación registrada correctamente.");
        setIsModalOpen(false);
        // Update both records and filteredRecords to reflect the change in real-time
        setRecords((prevRecords) =>
          prevRecords.map((record) =>
            record.id === registroId
              ? { ...record, observacion: observacion }
              : record
          )
        );
        setFilteredRecords((prevFiltered) =>
          prevFiltered.map((record) =>
            record.id === registroId
              ? { ...record, observacion: observacion }
              : record
          )
        );
      } else {
        toast.error(
          response.data.message ||
            "Ocurrió un error al registrar la observación."
        );
      }
    } catch (error) {
      console.error("Error al guardar la observación:", error);
      toast.error(
        "Ocurrió un error. Verifica tu conexión o intenta nuevamente."
      );
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full h-full min-h-screen p-5 bg-gray-100 overflow-auto">
      <div className="bg-white shadow-xl rounded-lg p-6 mx-auto max-w-full md:max-w-7xl">
        <div className="flex flex-col items-center mb-8 md:flex-row md:justify-between">
          <h2 className="text-3xl font-bold text-[#167f9f] leading-tight flex items-center text-center">
            <i className="fas fa-list-alt mr-3 text-[#167f9f]"></i>
            Listado de Entrada y Salida de Vehículos
          </h2>

          <div className="text-xl font-semibold text-gray-500 flex items-center mt-2 md:mt-0">
            <i className="fas fa-clock mr-2 text-green-600"></i>
            {time}
          </div>
        </div>

        <div className="relative flex items-center mb-6">
          <div className="w-10 h-10 bg-[#167f9f] text-white rounded-full flex items-center justify-center shadow-md">
            <i className="fas fa-search text-lg"></i>
          </div>
          <input
            type="text"
            placeholder="Buscar Placa..."
            value={searchQuery}
            onChange={handleSearch}
            className="ml-3 w-full sm:w-64 pl-4 pr-4 py-2 text-sm md:text-base text-gray-700 placeholder-gray-400 bg-white border border-[#167f9f] rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#167f9f]"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 mb-6">
          <button
            onClick={exportToExcel}
            className="px-6 py-3 border-2 border-[#2a6f3d] bg-[#2a6f3d] bg-opacity-20 text-[#2a6f3d] rounded-xl shadow-md hover:bg-[#276a37] hover:bg-opacity-80 hover:text-white focus:outline-none transition duration-200"
          >
            <i className="fas fa-file-excel mr-2"></i> Exportar a Excel
          </button>
          <button
            onClick={exportToPDF}
            className="px-6 py-3 border-2 border-[#e03c31] bg-[#e03c31] bg-opacity-20 text-[#e03c31] rounded-xl shadow-md hover:bg-[#cc3628] hover:bg-opacity-80 hover:text-white focus:outline-none transition duration-200"
          >
            <i className="fas fa-file-pdf mr-2"></i> Exportar a PDF
          </button>
        </div>

        <div className="space-y-6">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => (
              <div
                key={index}
                className="bg-blue-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <i className="fas fa-car-side text-blue-500 text-xl mr-2"></i>
                    <span className="text-lg font-bold text-blue-800">
                      {record.numero_placa}
                    </span>
                  </div>
                  <div
                    className={`inline-block px-6 py-3 rounded-md text-base font-medium ${
                      record.estado === "Entrada"
                        ? "bg-green-200 text-green-800"
                        : "bg-orange-200 text-orange-800"
                    }`}
                  >
                    <i
                      className={`mr-2 ${
                        record.estado === "Entrada"
                          ? "fas fa-arrow-circle-down"
                          : "fas fa-arrow-circle-up"
                      }`}
                    ></i>
                    {record.estado}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
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
                      {record.fecha_salida || "No registrada"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-clock text-green-500 mr-2"></i>
                    <span>
                      <strong>Hora Salida:</strong>{" "}
                      {record.hora_salida || "No registrada"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-comment-alt text-gray-500 mr-2"></i>
                    <span>
                      <strong>Observación:</strong>{" "}
                      {record.observacion || "Sin observación"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-4">
                  <button
                    onClick={() => handleSelectRecord(record)}
                    className="px-4 py-2 border-2 border-[#6a97c1] bg-white text-[#6a97c1] rounded-md shadow-md hover:bg-[#6a97c1] hover:text-white transition duration-200"
                  >
                    Seleccionar
                  </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-11/12 sm:w-1/2 md:w-1/3 border-4 border-[#6a97c1]">
            <h3 className="text-2xl font-semibold text-[#167f9f] mb-4">
              Detalles del Registro
            </h3>

            <div className="space-y-4">
              <div className="flex">
                <strong className="w-1/3 text-[#167f9f]">Placa:</strong>
                <span className="text-[#167f9f]">
                  {selectedRecord.numero_placa}
                </span>
              </div>
              <div className="flex">
                <strong className="w-1/3 text-[#167f9f]">Estado:</strong>
                <span className="text-[#167f9f]">{selectedRecord.estado}</span>
              </div>
              <div className="flex">
                <strong className="w-1/3 text-[#167f9f]">Fecha Entrada:</strong>
                <span className="text-[#167f9f]">
                  {selectedRecord.fecha_entrada}
                </span>
              </div>
              <div className="flex">
                <strong className="w-1/3 text-[#167f9f]">Hora Entrada:</strong>
                <span className="text-[#167f9f]">
                  {selectedRecord.hora_entrada}
                </span>
              </div>
              <div className="flex">
                <strong className="w-1/3 text-[#167f9f]">Fecha Salida:</strong>
                <span className="text-[#167f9f]">
                  {selectedRecord.fecha_salida || "No registrada"}
                </span>
              </div>
              <div className="flex">
                <strong className="w-1/3 text-[#167f9f]">Hora Salida:</strong>
                <span className="text-[#167f9f]">
                  {selectedRecord.hora_salida || "No registrada"}
                </span>
              </div>
              <div className="flex">
                <strong className="w-1/3 text-[#167f9f]">Observación:</strong>
                <textarea
                  value={observacion}
                  onChange={handleObservacionChange}
                  className="w-full h-24 px-2 py-1 border border-[#167f9f] rounded-md"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={handleSaveObservacion}
                className="px-4 py-2 bg-[#167f9f] text-white border border-[#167f9f] rounded-md hover:bg-white hover:text-[#167f9f] hover:border-[#167f9f]"
              >
                Guardar Observación
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-[#167f9f] text-white border border-[#167f9f] rounded-md hover:bg-white hover:text-[#167f9f] hover:border-[#167f9f]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default Listado;
