import React, { useState } from "react";
import axios from "axios";
import toastr from "toastr"; // Para mostrar notificaciones
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faIdCard, faPen } from "@fortawesome/free-solid-svg-icons";

const NewVehicleModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    numero_placa: "",
    tipo_vehiculo: "",
    propietario: "",
    dni: "",
  });

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("id");
    if (!userId) {
      toastr.error("Debes iniciar sesión primero");
      return;
    }

    try {
      const response = await axios.post(
        "https://rumipark-CamiMujica.pythonanywhere.com/vehiculos",
        {
          numero_placa: formData.numero_placa,
          tipo_vehiculo: formData.tipo_vehiculo,
          propietario: formData.propietario,
          dni: formData.dni,
        },
        {
          headers: {
            "Content-Type": "application/json",
            id: userId,
          },
        }
      );

      if (response.status === 201) {
        toastr.success("Vehículo registrado exitosamente");
        onSuccess(); // Notificamos al componente padre
        onClose(); // Cerramos el modal
      }
    } catch (error) {
      // Manejo de errores detallado
      const errorResponse = error.response ? error.response.data : null;
      const errorMessage =
        errorResponse?.error || error.message || "Error desconocido";
      console.error("Error detallado al registrar vehículo:", errorResponse);
      toastr.error(`Hubo un error al registrar el vehículo: ${errorMessage}`);
    }
  };

  // Maneja los cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Si el modal no está abierto, no se renderiza
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#6a97c1] text-white rounded-lg shadow-lg w-96 p-8 border-4 border-[#3a6e9f]">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Registrar Nuevo Vehículo
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Número de Placa */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faPen}
              className="absolute left-4 top-4"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              name="numero_placa"
              value={formData.numero_placa}
              onChange={handleChange}
              placeholder="Número de Placa"
              className="w-full pl-14 pr-5 py-3 text-lg border-2 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
              required
              style={{ borderColor: "#1da4cf" }}
            />
          </div>

          {/* Tipo de Vehículo */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faCar}
              className="absolute left-4 top-4"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              name="tipo_vehiculo"
              value={formData.tipo_vehiculo}
              onChange={handleChange}
              placeholder="Tipo de Vehículo"
              className="w-full pl-14 pr-5 py-3 text-lg border-2 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
              required
              style={{ borderColor: "#1da4cf" }}
            />
          </div>

          {/* Propietario */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faPen}
              className="absolute left-4 top-4"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              name="propietario"
              value={formData.propietario}
              onChange={handleChange}
              placeholder="Propietario"
              className="w-full pl-14 pr-5 py-3 text-lg border-2 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
              required
              style={{ borderColor: "#1da4cf" }}
            />
          </div>

          {/* DNI del Propietario */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faIdCard}
              className="absolute left-4 top-4"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="DNI del Propietario"
              className="w-full pl-14 pr-5 py-3 text-lg border-2 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
              required
              style={{ borderColor: "#1da4cf" }}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#3a6e9f] text-white rounded-lg hover:bg-[#2e5a7d] transition-all"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewVehicleModal;
