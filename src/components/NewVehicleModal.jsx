import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
  const [transcriptMessage, setTranscriptMessage] = useState(""); // Mensaje para feedback
  const recognitionRef = useRef(null);
  const formRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  // Detectar dispositivo móvil y navegador
  // eslint-disable-next-line no-unused-vars
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Limpiar formulario
  const resetForm = () => {
    setFormData({
      numero_placa: "",
      tipo_vehiculo: "",
      propietario: "",
      dni: "",
    });
    setTranscriptMessage("");
  };

  // Configurar reconocimiento de voz
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscriptMessage(
        "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Cambiado a false para resultados finales
    recognition.lang = "es-ES";

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();
      setTranscriptMessage(`Escuchado: ${transcript}`);

      // Comandos de control
      if (
        transcript.includes("desactivar micrófono") ||
        transcript.includes("para")
      ) {
        stopListening();
        setTranscriptMessage("Micrófono desactivado.");
        return;
      }

      if (transcript.includes("cancelar")) {
        stopListening();
        resetForm();
        onClose();
        setTranscriptMessage("Operación cancelada.");
        return;
      }

      if (transcript.includes("registrar")) {
        stopListening();
        if (formRef.current) {
          formRef.current.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          );
        }
        return;
      }

      // Procesar campos con expresiones regulares más flexibles
      const placaMatch = transcript.match(
        /(?:número de placa|placa)\s+([a-z0-9\s-]+)/i
      );
      const tipoMatch = transcript.match(
        /(?:tipo de vehículo|tipo)\s+([a-z\s]+)/i
      );
      const propietarioMatch = transcript.match(
        /(?:propietario|dueño)\s+([a-z\s]+)/i
      );
      const dniMatch = transcript.match(/(?:dni|documento)\s+([0-9]+)/i);

      if (placaMatch && placaMatch[1]) {
        const placa = placaMatch[1].replace(/\s/g, "").toUpperCase();
        setFormData((prev) => ({ ...prev, numero_placa: placa }));
        setTranscriptMessage(`Placa establecida: ${placa}`);
      }

      if (tipoMatch && tipoMatch[1]) {
        const tipo = tipoMatch[1].trim();
        const tipoCapitalized = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        setFormData((prev) => ({ ...prev, tipo_vehiculo: tipoCapitalized }));
        setTranscriptMessage(
          `Tipo de vehículo establecido: ${tipoCapitalized}`
        );
      }

      if (propietarioMatch && propietarioMatch[1]) {
        const nombre = propietarioMatch[1].trim();
        const nombreCapitalized = nombre
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        setFormData((prev) => ({ ...prev, propietario: nombreCapitalized }));
        setTranscriptMessage(`Propietario establecido: ${nombreCapitalized}`);
      }

      if (dniMatch && dniMatch[1]) {
        setFormData((prev) => ({ ...prev, dni: dniMatch[1] }));
        setTranscriptMessage(`DNI establecido: ${dniMatch[1]}`);
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en reconocimiento:", event.error);
      if (event.error === "no-speech") {
        setTranscriptMessage("No se detectó voz, intenta de nuevo.");
        if (isListening) restartRecognition();
      } else if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setTranscriptMessage("Permiso de micrófono denegado.");
        setIsListening(false);
        clearTimeout(restartTimeoutRef.current);
      } else {
        setTranscriptMessage(`Error: ${event.error}`);
        setIsListening(false);
        clearTimeout(restartTimeoutRef.current);
      }
    };

    recognition.onend = () => {
      if (isListening && !isSafari) {
        restartRecognition();
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearTimeout(restartTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, isSafari]);

  // Reiniciar reconocimiento
  const restartRecognition = () => {
    clearTimeout(restartTimeoutRef.current);
    restartTimeoutRef.current = setTimeout(() => {
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error("Error al reiniciar:", error);
          setIsListening(false);
          setTranscriptMessage("Error al reiniciar reconocimiento.");
        }
      }
    }, 200);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      setTranscriptMessage("Micrófono activado, di un comando...");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
      clearTimeout(restartTimeoutRef.current);
      setTranscriptMessage("Micrófono desactivado.");
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("id");
    if (!userId) {
      setTranscriptMessage("Debes iniciar sesión primero.");
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
        setTranscriptMessage("Vehículo registrado exitosamente.");
        onSuccess();
        resetForm();
        onClose();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Error desconocido";
      setTranscriptMessage(`Error al registrar: ${errorMessage}`);
      console.error("Error:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClose = () => {
    stopListening();
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#6a97c1] text-white rounded-lg shadow-lg w-full max-w-md p-6 sm:p-8 border-4 border-[#3a6e9f] mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-center">
            Registrar Nuevo Vehículo
          </h2>
          <button
            onClick={handleToggleListening}
            className={`p-2 rounded-full ${
              isListening ? "bg-red-500" : "bg-blue-500"
            } text-white hover:bg-opacity-80 transition-colors`}
            title={isListening ? "Desactivar micrófono" : "Activar micrófono"}
          >
            <FontAwesomeIcon
              icon={isListening ? faMicrophoneSlash : faMicrophone}
            />
          </button>
        </div>
        <p className="text-sm text-gray-200 mb-4">{transcriptMessage}</p>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FontAwesomeIcon
              icon={faPen}
              className="absolute left-4 top-3.5"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              name="numero_placa"
              value={formData.numero_placa}
              onChange={handleChange}
              placeholder="Número de Placa"
              className="w-full pl-12 pr-4 py-2.5 text-base border-2 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:outline-none"
              required
              style={{ borderColor: "#1da4cf" }}
            />
          </div>

          <div className="relative">
            <FontAwesomeIcon
              icon={faCar}
              className="absolute left-4 top-3.5"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              name="tipo_vehiculo"
              value={formData.tipo_vehiculo}
              onChange={handleChange}
              placeholder="Tipo de Vehículo"
              className="w-full pl-12 pr-4 py-2.5 text-base border-2 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:outline-none"
              required
              style={{ borderColor: "#1da4cf" }}
            />
          </div>

          <div className="relative">
            <FontAwesomeIcon
              icon={faPen}
              className="absolute left-4 top-3.5"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              name="propietario"
              value={formData.propietario}
              onChange={handleChange}
              placeholder="Propietario"
              className="w-full pl-12 pr-4 py-2.5 text-base border-2 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:outline-none"
              required
              style={{ borderColor: "#1da4cf" }}
            />
          </div>

          <div className="relative">
            <FontAwesomeIcon
              icon={faIdCard}
              className="absolute left-4 top-3.5"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="DNI del Propietario"
              className="w-full pl-12 pr-4 py-2.5 text-base border-2 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:outline-none"
              required
              style={{ borderColor: "#1da4cf" }}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3a6e9f] text-white rounded-lg hover:bg-[#2e5a7d] transition-all text-sm sm:text-base"
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
