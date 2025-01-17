import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Importar los estilos de Toastify

function Listado() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleString());
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [observacion, setObservacion] = useState("");
  const navigate = useNavigate();

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

  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(records);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Registros");
    writeFile(workbook, `registros_${new Date().toLocaleDateString()}.xlsx`);
    toast.success("Exportado a Excel con éxito");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
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

    doc.text("Listado de Entrada y Salida de Vehículos", 14, 10);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`registros_${new Date().toLocaleDateString()}.pdf`);
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
          "El ID del usuario no fue encontrado. Por favor, inicia sesión.",
          {
            position: "top-center",
            autoClose: 3000,
            theme: "colored",
          }
        );
        return;
      }

      const registroId = selectedRecord?.id;
      if (!registroId) {
        console.error(
          "Error: selectedRecord no contiene un id válido:",
          selectedRecord
        );
        toast.error("No se encontró el registro seleccionado.", {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });
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
        toast.success("Observación registrada correctamente.", {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });
        setIsModalOpen(false);
        setRecords((prevRecords) =>
          prevRecords.map((record) =>
            record.id === registroId
              ? { ...record, observacion: observacion }
              : record
          )
        );
      } else {
        toast.error(
          response.data.message ||
            "Ocurrió un error al registrar la observación.",
          {
            position: "top-center",
            autoClose: 3000,
            theme: "colored",
          }
        );
      }
    } catch (error) {
      console.error("Error al guardar la observación:", error);
      toast.error(
        "Ocurrió un error. Verifica tu conexión o intenta nuevamente.",
        {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        }
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

      <div className="flex justify-end gap-4 mb-6">
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
                <div className="col-span-2 flex items-center">
                  <i className="fas fa-comment-alt text-gray-500 mr-2"></i>
                  <span>
                    <strong>Observación:</strong>{" "}
                    {record.observacion || "Sin observación"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-4">
                <button
                  onClick={() => handleSelectRecord(record)} // Pasa el registro completo
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

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-2/3 sm:w-1/2 md:w-1/3 border-4 border-[#6a97c1]">
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
