import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toastr from "toastr"; // Para mostrar notificaciones
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faIdCard, faPen, faMicrophone, faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons";

const NewVehicleModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    numero_placa: "",
    tipo_vehiculo: "",
    propietario: "",
    dni: "",
  });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const formRef = useRef(null); // Referencia al formulario para disparar el envío

  // Limpiar los campos al cerrar el modal
  const resetForm = () => {
    setFormData({
      numero_placa: "",
      tipo_vehiculo: "",
      propietario: "",
      dni: "",
    });
  };

  // Configurar el reconocimiento de voz
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("El navegador no soporta la API de reconocimiento de voz.");
      toastr.error("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Mantener el reconocimiento activo hasta que se detenga manualmente
    recognition.interimResults = false;
    recognition.lang = "es-ES"; // Configurar idioma español

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log("Texto reconocido:", transcript);

      // Comandos para desactivar el micrófono
      if (transcript.includes("desactivar micrófono")) {
        stopListening();
        return;
      }

      // Comando para cancelar
      if (transcript.includes("cancelar")) {
        stopListening();
        resetForm();
        onClose();
        toastr.info("Formulario cancelado");
        return;
      }

      // Comando para registrar
      if (transcript.includes("registrar")) {
        stopListening();
        if (formRef.current) {
          formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
        return;
      }

      // Procesar comandos para llenar los campos
      if (transcript.includes("número de placa")) {
        const placaMatch = transcript.match(/número de placa\s+([a-z0-9\s-]+)/i);
        if (placaMatch && placaMatch[1]) {
          const placa = placaMatch[1].replace(/\s/g, "").toUpperCase();
          setFormData((prev) => ({ ...prev, numero_placa: placa }));
          toastr.info(`Número de placa establecido: ${placa}`);
        }
      } else if (transcript.includes("tipo de vehículo")) {
        const tipoMatch = transcript.match(/tipo de vehículo\s+([a-z\s]+)/i);
        if (tipoMatch && tipoMatch[1]) {
          const tipo = tipoMatch[1].trim();
          const tipoCapitalized = tipo.charAt(0).toUpperCase() + tipo.slice(1);
          setFormData((prev) => ({ ...prev, tipo_vehiculo: tipoCapitalized }));
          toastr.info(`Tipo de vehículo establecido: ${tipoCapitalized}`);
        }
      } else if (transcript.includes("propietario")) {
        const propietarioMatch = transcript.match(/propietario\s+([a-z\s]+)/i);
        if (propietarioMatch && propietarioMatch[1]) {
          const nombre = propietarioMatch[1].trim();
          const nombreCapitalized = nombre.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
          setFormData((prev) => ({ ...prev, propietario: nombreCapitalized }));
          toastr.info(`Propietario establecido: ${nombreCapitalized}`);
        }
      } else if (transcript.includes("dni")) {
        const dniMatch = transcript.match(/dni\s+([0-9]+)/i);
        if (dniMatch && dniMatch[1]) {
          setFormData((prev) => ({ ...prev, dni: dniMatch[1] }));
          toastr.info(`DNI establecido: ${dniMatch[1]}`);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
      if (event.error === "no-speech") {
        console.log("No se detectó voz, intentando reiniciar...");
        recognition.start();
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toastr.error("Permiso para usar el micrófono denegado.");
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        console.log("Reconocimiento de voz finalizado, reiniciando...");
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, onClose]); // Agregamos onClose a las dependencias para que se limpie al cerrar

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      console.log("Reconocimiento de voz activado");
      toastr.info("Micrófono activado. Di 'desactivar micrófono' o haz clic para detener.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
      console.log("Reconocimiento de voz desactivado");
      toastr.info("Micrófono desactivado");
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

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
        resetForm(); // Limpiamos los campos
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

  // Maneja el cierre del modal
  const handleClose = () => {
    stopListening(); // Detener el micrófono si está activo
    resetForm(); // Limpiar los campos
    onClose(); // Cerrar el modal
  };

  // Si el modal no está abierto, no se renderiza
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#6a97c1] text-white rounded-lg shadow-lg w-96 p-8 border-4 border-[#3a6e9f]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-center">
            Registrar Nuevo Vehículo
          </h2>
          <button
            onClick={handleToggleListening}
            className={`p-2 rounded-full ${
              isListening ? "bg-red-500" : "bg-blue-500"
            } text-white hover:bg-opacity-80 transition-colors`}
            title={isListening ? "Desactivar micrófono" : "Activar micrófono"}
          >
            <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} />
          </button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
              onClick={handleClose}
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
