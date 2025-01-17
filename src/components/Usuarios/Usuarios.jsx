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

  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(usuarios);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Usuarios");
    writeFile(workbook, `usuarios_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Placa", "Tipo Vehículo", "Propietario", "DNI"];
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
                <div className="flex items-center">
                  <i className="fas fa-user-circle text-blue-500 mr-3 text-xl"></i>
                  <span>
                    <strong>Propietario:</strong> {usuario.propietario || "N/A"}
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-id-card text-blue-500 mr-3 text-xl"></i>
                  <span>
                    <strong>DNI:</strong> {usuario.dni}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            No hay usuarios disponibles.
          </div>
        )}
      </div>
    </div>
  );
}

export default Usuarios;
