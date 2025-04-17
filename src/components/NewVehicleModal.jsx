import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toastr from "toastr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faIdCard,
  faPen,
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";

const NewVehicleModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    numero_placa: "",
    tipo_vehiculo: "",
    propietario: "",
    dni: "",
  });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const formRef = useRef(null);

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
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("El navegador no soporta la API de reconocimiento de voz.");
      toastr.error(
        "Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES"; // Configurar idioma español
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true; // Mantener el reconocimiento activo hasta que se detenga manualmente

    recognition.onstart = () => {
      toastr.info("Micrófono activado. Di 'detener' o haz clic para detener.");
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();
      console.log("Texto reconocido:", transcript);

      // Comandos para detener el micrófono
      if (transcript.includes("detener")) {
        stopListening();
        toastr.info("Micrófono desactivado");
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
          formRef.current.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          );
        }
        return;
      }

      // Procesar comandos para llenar los campos
      const words = transcript.split(" ");
      let field = words[0];
      let valueStart = 1;

      if (
        words.length > 1 &&
        words[0] === "guardar" &&
        words[1] === "vehículo"
      ) {
        field = "guardar vehículo";
        valueStart = 2;
      }

      const value = words.slice(valueStart).join(" ").trim();

      switch (field) {
        case "número":
          if (words[1] === "de" && words[2] === "placa") {
            const placaValue = words.slice(3).join("").toUpperCase();
            setFormData((prev) => ({ ...prev, numero_placa: placaValue }));
            toastr.info(`Número de placa establecido: ${placaValue}`);
          }
          break;
        case "tipo":
          if (words[1] === "de" && words[2] === "vehículo") {
            const tipoValue = words.slice(3).join(" ");
            const tipoCapitalized =
              tipoValue.charAt(0).toUpperCase() + tipoValue.slice(1);
            setFormData((prev) => ({
              ...prev,
              tipo_vehiculo: tipoCapitalized,
            }));
            toastr.info(`Tipo de vehículo establecido: ${tipoCapitalized}`);
          }
          break;
        case "propietario":
          const nombreCapitalized = value
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          setFormData((prev) => ({ ...prev, propietario: nombreCapitalized }));
          toastr.info(`Propietario establecido: ${nombreCapitalized}`);
          break;
        case "dni":
          const dniDigits = value.replace(/\s/g, "");
          setFormData((prev) => ({ ...prev, dni: dniDigits }));
          toastr.info(`DNI establecido: ${dniDigits}`);
          break;
        case "guardar":
          if (field === "guardar vehículo") {
            stopListening();
            if (formRef.current) {
              formRef.current.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true })
              );
            }
          }
          break;
        default:
          toastr.error(
            "⚠️ Campo no reconocido. Usa: número de placa, tipo de vehículo, propietario, dni, guardar vehículo"
          );
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
      if (event.error === "no-speech") {
        console.log("No se detectó voz, intentando reiniciar...");
        recognition.start();
      } else if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        toastr.error("Permiso para usar el micrófono denegado.");
        setIsListening(false);
      } else {
        toastr.error(`Error en el reconocimiento de voz: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, onClose]); // Agregamos onClose a las dependencias para que se limpie al cerrar

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      console.log("Reconocimiento de voz activado");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
      console.log("Reconocimiento de voz desactivado");
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
            title={isListening ? "Detener micrófono" : "Activar micrófono"}
          >
            <FontAwesomeIcon
              icon={isListening ? faMicrophoneSlash : faMicrophone}
            />
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
