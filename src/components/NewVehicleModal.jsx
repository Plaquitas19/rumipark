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
      toastr.error(
        "Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      toastr.info("Micrófono activado. Di 'detener' o 'cancelar' para parar.");
    };

    recognition.onend = () => {
      // Solo reiniciar si isListening es true y no se ha detenido manualmente
      if (isListening) {
        console.log("Reconocimiento detenido, reiniciando...");
        try {
          recognition.start();
        } catch (error) {
          console.error("Error al reiniciar reconocimiento:", error);
          setIsListening(false);
          toastr.error("Error al reiniciar el micrófono. Intenta de nuevo.");
        }
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
      if (transcript.includes("registrar") || transcript.includes("guardar vehículo")) {
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

      if (words.length > 2 && words[0] === "número" && words[1] === "de" && words[2] === "placa") {
        field = "numero_placa";
        valueStart = 3;
      } else if (words.length > 2 && words[0] === "tipo" && words[1] === "de" && words[2] === "vehículo") {
        field = "tipo_vehiculo";
        valueStart = 3;
      }

      const value = words.slice(valueStart).join(" ").trim();

      switch (field) {
        case "numero_placa":
          const placaValue = value.replace(/\s/g, "").toUpperCase();
          setFormData((prev) => ({ ...prev, numero_placa: placaValue }));
          toastr.info(`Número de placa establecido: ${placaValue}`);
          break;
        case "tipo_vehiculo":
          const tipoCapitalized = value
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          setFormData((prev) => ({ ...prev, tipo_vehiculo: tipoCapitalized }));
          toastr.info(`Tipo de vehículo establecido: ${tipoCapitalized}`);
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
        default:
          toastr.error(
            "⚠️ Campo no reconocido. Usa: número de placa, tipo de vehículo, propietario, dni, guardar vehículo"
          );
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
      if (event.error === "no-speech") {
        // Silencio detectado, reiniciar si sigue escuchando
        if (isListening) {
          console.log("No se detectó voz, intentando reiniciar...");
          try {
            recognition.start();
          } catch (error) {
            console.error("Error al reiniciar tras no-speech:", error);
          }
        }
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toastr.error("Permiso para usar el micrófono denegado.");
        setIsListening(false);
      } else if (event.error === "aborted") {
        console.log("Reconocimiento abortado, intentando reiniciar...");
        if (isListening) {
          try {
            recognition.start();
          } catch (error) {
            console.error("Error al reiniciar tras abort:", error);
          }
        }
      } else {
        toastr.error(`Error en el reconocimiento de voz: ${event.error}`);
        if (isListening) {
          try {
            recognition.start();
          } catch (error) {
            console.error("Error al reiniciar tras error:", error);
          }
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, onClose]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      try {
        recognitionRef.current.start();
        console.log("Reconocimiento de voz activado");
      } catch (error) {
        console.error("Error al iniciar reconocimiento:", error);
        toastr.error("No se pudo activar el micrófono. Verifica los permisos.");
        setIsListening(false);
      }
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
        onSuccess();
        resetForm();
        onClose();
      }
    } catch (error) {
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
    stopListening();
    resetForm();
    onClose();
  };

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
