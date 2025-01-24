import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleString());
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("id");

    if (!userId) {
      navigate("/");
      return;
    }

    const fetchUsuarios = async () => {
      try {
        const response = await axios.get(
          "https://CamiMujica.pythonanywhere.com/listar_vehiculos",
          {
            headers: {
              "Content-Type": "application/json",
              id: userId,
            },
          }
        );
        const usuariosData = response.data.vehiculos || [];
        setUsuarios(usuariosData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error de API:", error);
        setError("Error al obtener los usuarios. Intente nuevamente.");
        setIsLoading(false);
      }
    };

    fetchUsuarios();

    const intervalId = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const simulateProgress = (callback) => {
    let progressValue = 0;
    setIsExporting(true);
    const interval = setInterval(() => {
      progressValue += 5;
      setProgress(progressValue);
      if (progressValue >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          callback();
          setIsExporting(false);
          setProgress(0);
        }, 500);
      }
    }, 100);
  };

  const exportToExcel = () => {
    setExportType("Excel");
    simulateProgress(() => {
      const worksheet = utils.json_to_sheet(usuarios);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Usuarios");
      writeFile(workbook, `usuarios_${new Date().toLocaleDateString()}.xlsx`);
    });
  };

  const exportToPDF = () => {
    setExportType("PDF");
    simulateProgress(() => {
      const doc = new jsPDF();
      const tableColumn = [
        "ID",
        "Placa",
        "Tipo Vehículo",
        "Propietario",
        "DNI",
      ];
      const tableRows = usuarios.map((usuario) => [
        usuario.id,
        usuario.numero_placa,
        usuario.tipo_vehiculo,
        usuario.propietario || "N/A",
        usuario.dni,
      ]);

      doc.text("Listado de Usuarios Registrados", 14, 10);
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });

      doc.save(`usuarios_${new Date().toLocaleDateString()}.pdf`);
    });
  };

  const ProgressSphere = () => {
    const arcColor =
      exportType === "Excel"
        ? "rgba(0, 128, 0, 0.7)"
        : "rgba(220, 97, 93, 0.7)"; // Verde para Excel, rojo para PDF
    const lightColor =
      exportType === "Excel"
        ? "rgba(144, 238, 144, 0.5)"
        : "rgba(255, 204, 204, 0.5)"; // Luz superior según tipo

    return (
      <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
        {/* Fondo de la esfera con efecto de vidrio */}
        <div
          className="absolute w-full h-full bg-white rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow:
              "inset 0 4px 6px rgba(255, 255, 255, 0.7), inset 0 -4px 6px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        ></div>

        {/* Representación de progreso como un arco */}
        <div
          className="absolute w-full h-full rounded-full overflow-hidden"
          style={{
            background: `conic-gradient(
              ${arcColor} ${progress * 3.6}deg, 
              rgba(255, 255, 255, 0.1) 0deg
            )`,
          }}
        ></div>

        {/* Punto de luz superior para un efecto 3D */}
        <div
          className="absolute top-2 left-2 w-12 h-12 bg-white rounded-full"
          style={{
            opacity: 0.3,
            background: lightColor,
            boxShadow: `0 0 10px 5px ${lightColor}`,
          }}
        ></div>

        {/* Texto del progreso */}
        <span className="absolute text-lg font-bold text-gray-700">
          {progress}%
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin border-4 border-solid border-blue-600 rounded-full w-12 h-12 mx-auto my-4"></div>
        <p className="text-lg text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 text-red-600 text-lg">{error}</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-8 mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-8 border-b-2 pb-4">
        <h2 className="text-4xl font-bold text-blue-800 flex items-center">
          <i className="fas fa-users mr-3 text-blue-600"></i>
          Listado de Usuarios
        </h2>
        <div className="text-lg font-semibold text-gray-600">
          <i className="fas fa-clock mr-2 text-green-600"></i>
          {time}
        </div>
      </div>

      <div className="flex justify-end gap-6 mb-6">
        <button
          onClick={exportToExcel}
          className="px-6 py-3 border-2 border-[#2a6f3d] bg-[#2a6f3d] bg-opacity-20 text-[#2a6f3d] rounded-xl shadow-md hover:bg-[#276a37] hover:bg-opacity-80 hover:text-white focus:outline-none transition duration-200"
        >
          <i className="fas fa-file-excel mr-2"></i> Exportar a Excel
        </button>

        <button
          onClick={exportToPDF}
          className="px-6 py-3 border-2 border-[#dc615d] bg-[#fce1e0] text-[#dc615d] rounded-xl shadow-md hover:bg-[#dc615d] hover:text-white focus:outline-none transition duration-200"
        >
          <i className="fas fa-file-pdf mr-2"></i> Exportar a PDF
        </button>
      </div>

      {isExporting && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <p className="text-xl font-semibold text-gray-700 mb-4">
              Exportando a {exportType}...
            </p>
            <ProgressSphere />
          </div>
        </div>
      )}

      <div className="space-y-8">
        {usuarios.length > 0 ? (
          usuarios.map((usuario, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <i className="fas fa-user text-blue-600 text-3xl mr-2"></i>
                  <span className="text-xl font-bold text-blue-800">
                    {usuario.numero_placa}
                  </span>
                </div>
                <div className="text-lg font-medium text-gray-700">
                  Tipo: {usuario.tipo_vehiculo}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-md text-gray-700">
                <div className="flex flex-col">
                  <span className="font-medium">Propietario:</span>
                  <span className="text-gray-500">{usuario.propietario}</span>
                </div>

                <div className="flex flex-col">
                  <span className="font-medium">DNI:</span>
                  <span className="text-gray-500">{usuario.dni}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-xl text-gray-500">
            No se encontraron vehículos registrados.
          </div>
        )}
      </div>
    </div>
  );
}

export default Usuarios;
