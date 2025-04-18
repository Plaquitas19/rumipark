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
  const silenceTimeoutRef = useRef(null);

  // Limpiar los campos al cerrar el modal
  const resetForm = () => {
    setFormData({
      numero_placa: "",
      tipo_vehiculo: "",
      propietario: "",
      dni: "",
    });
  };

  // Verificar permisos del micrófono
  const checkMicrophonePermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: "microphone" });
      if (permission.state === "denied") {
        toastr.error("Por favor, habilita el permiso del micrófono en tu dispositivo.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error al verificar permisos del micrófono:", error);
      return true; // Continuar si la API de permisos no está soportada
    }
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
      console.log("Reconocimiento de voz iniciado");
      toastr.info("Micrófono activado. Habla para llenar los campos.");
    };

    recognition.onend = () => {
      console.log("Reconocimiento detenido");
      if (isListening) {
        console.log("Reiniciando reconocimiento automáticamente...");
        setTimeout(() => {
          try {
            if (isListening) {
              recognition.start();
              console.log("Reinicio exitoso");
            }
          } catch (error) {
            console.error("Error al reiniciar reconocimiento:", error.message);
            setIsListening(false);
            toastr.error("Error al mantener el micrófono activo. Intenta de nuevo.");
          }
        }, 50); // Retraso mínimo para evitar errores de "micrófono ocupado"
      } else {
        console.log("Reconocimiento detenido intencionalmente");
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();
      console.log("Texto reconocido:", transcript);

      // Reiniciar el temporizador de silencio
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

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
      let field = null;
      let value = "";

      if (transcript.startsWith("número de placa")) {
        field = "numero_placa";
        value = transcript.replace("número de placa", "").trim();
      } else if (transcript.startsWith("tipo de vehículo")) {
        field = "tipo_vehiculo";
        value = transcript.replace("tipo de vehículo", "").trim();
      } else if (transcript.startsWith("propietario")) {
        field = "propietario";
        value = transcript.replace("propietario", "").trim();
      } else if (transcript.startsWith("dni")) {
        field = "dni";
        value = transcript.replace("dni", "").trim();
      }

      if (field && value) {
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
        }
      } else {
        toastr.error(
          "⚠️ Comando no reconocido. Usa: número de placa, tipo de vehículo, propietario, dni, guardar vehículo"
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
      if (event.error === "no-speech") {
        console.log("No se detectó voz, programando reinicio...");
        if (isListening) {
          silenceTimeoutRef.current = setTimeout(() => {
            try {
              recognition.start();
              console.log("Reinicio tras no-speech exitoso");
            } catch (error) {
              console.error("Error al reiniciar tras no-speech:", error.message);
              setIsListening(false);
              toastr.error("Error al mantener el micrófono activo. Intenta de nuevo.");
            }
          }, 800); // Reducido a 0.8 segundos para mayor fluidez
        }
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        console.error("Permiso del micrófono denegado");
        toastr.error("Permiso para usar el micrófono denegado. Habilítalo en la configuración.");
        setIsListening(false);
      } else if (event.error === "aborted" || event.error === "network") {
        console.log("Reconocimiento abortado o error de red, intentando reiniciar...");
        if (isListening) {
          setTimeout(() => {
            try {
              if (isListening) {
                recognition.start();
                console.log("Reinicio tras error exitoso");
              }
            } catch (error) {
              console.error("Error al reiniciar tras error:", error.message);
              setIsListening(false);
              toastr.error("Error al mantener el micrófono activo. Intenta de nuevo.");
            }
          }, 50);
        }
      } else {
        console.error("Error desconocido:", event.error);
        toastr.error(`Error en el reconocimiento de voz: ${event.error}`);
        if (isListening) {
          setTimeout(() => {
            try {
              if (isListening) {
                recognition.start();
                console.log("Reinicio tras error desconocido exitoso");
              }
            } catch (error) {
              console.error("Error al reiniciar tras error desconocido:", error.message);
              setIsListening(false);
              toastr.error("Error al mantener el micrófono activo. Intenta de nuevo.");
            }
          }, 50);
        }
      }
    };

    recognition.onspeechstart = () => {
      console.log("Voz detectada");
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      console.log("Limpiando reconocimiento de voz");
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [isListening, onClose]);

  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) return;

      setIsListening(true);
      try {
        recognitionRef.current.start();
        console.log("Reconocimiento de voz activado");
      } catch (error) {
        console.error("Error al iniciar reconocimiento:", error.message);
        toastr.error("No se pudo activar el micrófono. Verifica los permisos.");
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
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
