// src/components/NewVehicleModal.jsx
import React, { useState } from "react";
import axios from "axios";

const NewVehicleModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    numero_placa: "",
    tipo_vehiculo: "",
    propietario: "",
    dni: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://CamiMujica.pythonanywhere.com/vehiculos", formData);
      if (response.status === 201) {
        alert("Vehículo registrado exitosamente");
        onSuccess(); // Callback para actualizar la lista u otra acción
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert("Error al registrar el vehículo. Por favor, intente nuevamente.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#6a97c1] text-white rounded-lg shadow-lg w-96 p-8 border-4 border-[#3a6e9f] focus:outline-none focus:ring-4 focus:ring-[#3a6e9f] hover:shadow-lg hover:shadow-[#3a6e9f] transition-all 
                    shadow-[0px_0px_40px_0px_rgba(58,110,159,0.8)]">
        <h2 className="text-2xl font-semibold text-center mb-6">Registrar Nuevo Vehículo</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Número de Placa</label>
            <input
              type="text"
              name="numero_placa"
              value={formData.numero_placa}
              onChange={handleChange}
              className="w-full mt-2 p-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3a6e9f] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Tipo de Vehículo</label>
            <input
              type="text"
              name="tipo_vehiculo"
              value={formData.tipo_vehiculo}
              onChange={handleChange}
              className="w-full mt-2 p-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3a6e9f] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Propietario</label>
            <input
              type="text"
              name="propietario"
              value={formData.propietario}
              onChange={handleChange}
              className="w-full mt-2 p-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3a6e9f] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">DNI</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              className="w-full mt-2 p-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3a6e9f] transition-all"
              required
            />
          </div>

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
              className="px-6 py-3 bg-[#3a6e9f] text-white rounded-lg hover:bg-[#2e5a7d] focus:outline-none focus:ring-4 focus:ring-[#3a6e9f] transition-all"
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
