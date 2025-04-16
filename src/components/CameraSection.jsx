import React, { useState, useEffect, useRef } from "react";
import NewVehicleModal from "./NewVehicleModal";
import "@fortawesome/fontawesome-free/css/all.css";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

const CameraSection = () => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState("");
  const [plateImage, setPlateImage] = useState(null);
  const [error, setError] = useState("");
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [isPlateRegistered, setIsPlateRegistered] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [isEditingPlate, setIsEditingPlate] = useState(false);
  const [editablePlate, setEditablePlate] = useState("");
  const [blockedPlates, setBlockedPlates] = useState({}); // Para salidas recientes (2 minutos)
  const [recentEntries, setRecentEntries] = useState({}); // Para entradas recientes (3 minutos)
  const [lastNotificationMessage, setLastNotificationMessage] = useState(""); // Para rastrear el último mensaje mostrado
  const [isPlateDetected, setIsPlateDetected] = useState(false);
  const readNotificationsRef = useRef(new Set());

  useEffect(() => {
    let detectionInterval;
    if (isCameraActive) {
      detectionInterval = setInterval(() => {
        detectFromCamera();
      }, 2000);
    } else {
      clearInterval(detectionInterval);
    }
    return () => clearInterval(detectionInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Limpiar blockedPlates (salidas)
      setBlockedPlates((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((plate) => {
          if (now >= updated[plate]) {
            delete updated[plate];
          }
        });
        return updated;
      });
      // Limpiar recentEntries (entradas)
      setRecentEntries((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((plate) => {
          if (now >= updated[plate]) {
            delete updated[plate];
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dataURLToFile = (dataURL, filename) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCameraToggle = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      let backCamera = videoDevices.find((device) =>
        device.label.toLowerCase().includes("back")
      );
      const camera =
        backCamera ||
        videoDevices.find((device) => device.kind === "videoinput");
      if (!camera) {
        throw new Error("No hay cámaras disponibles.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: camera.deviceId },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const showNotification = (message, type) => {
    // Solo mostrar la notificación si es diferente a la última mostrada
    if (message !== lastNotificationMessage) {
      toastr.clear(); // Limpiar notificaciones anteriores
      toastr[type](message, "", { timeOut: 0 }); // timeOut: 0 para que no desaparezca automáticamente
      setLastNotificationMessage(message);

      if (!readNotificationsRef.current.has(message)) {
        const utterance = new SpeechSynthesisUtterance(message);
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice =
          voices.find((voice) => voice.lang === "es-ES") || voices[0];
        utterance.voice = spanishVoice;
        utterance.lang = "es-ES";
        utterance.rate = 1;
        utterance.pitch = 1.2;
        window.speechSynthesis.speak(utterance);
        readNotificationsRef.current.add(message);
      }
    }
  };

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const normalizePlate = (plate) => {
    return plate.replace(/-/g, "").toUpperCase();
  };

  const detectPlate = async (file) => {
    const userId = localStorage.getItem("id");
    if (!userId) {
      showNotification("Usuario no autenticado", "error");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", userId);
    try {
      const response = await fetch(
        "https://rumipark-CamiMujica.pythonanywhere.com/detectar_y_verificar_y_entrada",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (response.ok && data.placa_detectada) {
        const normalizedPlate = normalizePlate(data.placa_detectada);
        setDetectedPlate(normalizedPlate);
        setPlateImage(`data:image/jpeg;base64,${data.placa_imagen}`);
        setIsPlateDetected(true);

        // Verificar si hay una entrada reciente (3 minutos) para esta placa
        if (recentEntries[normalizedPlate]) {
          showNotification(
            `Entrada reciente para la placa ${normalizedPlate}. Debe esperar 3 minutos antes de registrar una nueva entrada.`,
            "info"
          );
          setIsPlateDetected(false);
          return;
        }

        // Verificar si hay una salida reciente (2 minutos) para esta placa
        if (blockedPlates[normalizedPlate]) {
          showNotification(
            `Salida reciente para la placa ${normalizedPlate}. Debe esperar 2 minutos antes de registrar una nueva entrada.`,
            "info"
          );
          setIsPlateDetected(false);
          return;
        }

        // Verificar si la placa está registrada
        try {
          const detailsResponse = await fetch(
            `https://rumipark-CamiMujica.pythonanywhere.com/vehiculo/${normalizedPlate}?id=${userId}`
          );
          const detailsData = await detailsResponse.json();
          if (detailsResponse.ok) {
            setIsPlateRegistered(true);
            setVehicleDetails(detailsData);

            // Registrar entrada o salida según el estado
            if (!data.entrada_registrada) {
              showNotification("Entrada registrada.", "success");
              // Registrar el tiempo de la entrada (3 minutos de bloqueo) solo para esta placa
              setRecentEntries((prev) => ({
                ...prev,
                [normalizedPlate]: Date.now() + 3 * 60 * 1000, // 3 minutos
              }));
            } else {
              await registerExit(normalizedPlate, userId);
            }
          } else {
            setIsPlateRegistered(false);
            setVehicleDetails(null);
            showNotification(
              "Placa no registrada. Por favor, registre el vehículo.",
              "warning"
            );
          }
        } catch (err) {
          console.error("Error al obtener detalles del vehículo:", err);
          setIsPlateRegistered(false);
          setVehicleDetails(null);
          showNotification(
            "No se pudieron obtener los detalles del vehículo.",
            "error"
          );
        }
      } else {
        setIsPlateDetected(false);
        setDetectedPlate("");
        setPlateImage(null);
        setIsPlateRegistered(null);
        setVehicleDetails(null);
        showNotification(data.mensaje || "No se detectaron placas.", "error");
      }
    } catch (err) {
      setIsPlateDetected(false);
      setDetectedPlate("");
      setPlateImage(null);
      setIsPlateRegistered(null);
      setVehicleDetails(null);
      showNotification("Error al procesar la imagen.", "error");
      console.error("Error al enviar la imagen:", err);
    }
  };

  const registerExit = async (plate, userId) => {
    // Verificar si hay una entrada reciente (3 minutos) para esta placa
    if (recentEntries[plate]) {
      showNotification(
        `Entrada reciente para la placa ${plate}. Debe esperar 3 minutos antes de registrar una salida.`,
        "info"
      );
      return;
    }

    try {
      const response = await fetch(
        "https://rumipark-CamiMujica.pythonanywhere.com/salida",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numero_placa: plate,
            usuario_id: userId,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setVehicleDetails(data.vehiculo);
        showNotification("Salida registrada automáticamente.", "success");
        // Registrar el tiempo de la salida (2 minutos de bloqueo) solo para esta placa
        setBlockedPlates((prev) => ({
          ...prev,
          [plate]: Date.now() + 2 * 60 * 1000, // 2 minutos
        }));
        // Limpiar el bloqueo de entrada para esta placa
        setRecentEntries((prev) => {
          const updated = { ...prev };
          delete updated[plate];
          return updated;
        });
      } else {
        showNotification(
          `Error: ${data.message || "No se pudo registrar la salida."}`,
          "warning"
        );
        console.error("Respuesta de error de la API:", data);
      }
    } catch (err) {
      showNotification("Error al intentar registrar la salida.", "error");
      console.error("Error en el frontend:", err);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      detectPlate(file);
    }
  };

  const detectFromCamera = async () => {
    if (!isCameraActive || !videoRef.current) {
      showNotification(
        "Debes activar la cámara para poder detectar la placa.",
        "error"
      );
      return;
    }
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");
    const file = dataURLToFile(imageData, "captura.jpg");
    detectPlate(file);
  };

  return (
    <div className="container mx-auto p-6 bg-gray-200 rounded-xl shadow-lg">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center relative">
          <div
            ref={containerRef}
            className="relative w-full h-[65vh] bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden"
          >
            {!isCameraActive && (
              <p className="text-white text-center">
                Esperando cámara en vivo...
              </p>
            )}
            <video
              ref={videoRef}
              className="absolute w-auto h-full object-cover rounded-lg"
            ></video>
          </div>
          <div className="flex flex-col md:flex-row justify-between w-full mt-4 px-4 gap-4">
            <button
              className="px-6 py-3 bg-[#167f9f] text-white rounded-lg hover:bg-[#146c83] w-full md:w-auto flex items-center justify-center"
              onClick={() => setIsNewVehicleModalOpen(true)}
            >
              <i className="fas fa-car-side mr-2"></i>
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="p-4 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCameraToggle}
                  className="px-6 py-2 bg-[#167f9f] text-white rounded-lg hover:bg-[#146c83]"
                >
                  <i
                    className={`fas ${
                      isCameraActive ? "fa-camera-slash" : "fa-camera"
                    } mr-2`}
                  ></i>
                  {isCameraActive ? "Desactivar cámara" : "Activar cámara"}
                </button>
                <label className="px-6 py-2 bg-[#167f9f] text-white rounded-lg hover:bg-[#146c83] cursor-pointer">
                  <i className="fas fa-upload mr-2"></i>Subir Imagen
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="mt-6 text-center">
              {isPlateDetected && plateImage && (
                <div>
                  <p
                    className={`text-${
                      isPlateRegistered ? "green" : "red"
                    }-500 font-semibold`}
                  >
                    {isPlateRegistered
                      ? "Placa registrada"
                      : "Placa no registrada. Por favor, registre el vehículo."}
                  </p>
                  <img
                    src={plateImage}
                    alt="Placa detectada"
                    className="w-48 h-auto border-4 border-gray-300 rounded-xl shadow-md mt-4"
                  />
                  <div className="flex items-center justify-center gap-4 mt-4">
                    {isEditingPlate ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editablePlate}
                          onChange={(e) => setEditablePlate(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring focus:ring-blue-500"
                        />
                        <button
                          onClick={async () => {
                            const normalizedEditablePlate =
                              normalizePlate(editablePlate);
                            setDetectedPlate(normalizedEditablePlate);
                            setIsEditingPlate(false);
                            const userId = localStorage.getItem("id");
                            try {
                              const response = await fetch(
                                `https://rumipark-CamiMujica.pythonanywhere.com/vehiculo/${normalizedEditablePlate}?id=${userId}`
                              );
                              if (!response.ok) {
                                if (response.status === 404) {
                                  showNotification(
                                    "La placa corregida no está registrada. Por favor, regístrala primero.",
                                    "error"
                                  );
                                  setIsPlateRegistered(false);
                                  return;
                                } else {
                                  showNotification(
                                    "Error al verificar el estado de la placa.",
                                    "error"
                                  );
                                  return;
                                }
                              }
                              const data = await response.json();
                              setVehicleDetails(data);
                              setIsPlateRegistered(true);
                              showNotification(
                                "Placa corregida y verificada. Ahora puedes registrar la entrada manualmente.",
                                "success"
                              );
                            } catch (err) {
                              console.error(
                                "Error al procesar la placa editada:",
                                err
                              );
                              showNotification(
                                "Hubo un problema al procesar la placa editada. Por favor, inténtalo más tarde.",
                                "error"
                              );
                            }
                          }}
                          className="px-2 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {detectedPlate}
                        </span>
                        <button
                          onClick={() => {
                            setEditablePlate(detectedPlate);
                            setIsEditingPlate(true);
                          }}
                          className="px-2 py-1 bg-gray-300 text-gray-600 rounded-full hover:bg-gray-400 transition-all"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  {vehicleDetails && (
                    <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-300 space-y-6">
                      <h3 className="text-2xl font-bold text-gray-800 text-center flex items-center justify-center gap-2">
                        <i className="fas fa-car text-blue-600"></i> Detalles
                        del Vehículo
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-car-side text-lg"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-600">
                              Tipo de Vehículo
                            </p>
                            <p className="text-lg font-semibold text-blue-800">
                              {vehicleDetails.tipo_vehiculo}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-lg"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-600">
                              Propietario
                            </p>
                            <p className="text-lg font-semibold text-green-800">
                              {vehicleDetails.propietario}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-id-card text-lg"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-600">
                              DNI
                            </p>
                            <p className="text-lg font-semibold text-yellow-800">
                              {vehicleDetails.dni}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </div>
        </div>
      </div>
      <NewVehicleModal
        isOpen={isNewVehicleModalOpen}
        onClose={() => setIsNewVehicleModalOpen(false)}
        onSuccess={() => console.log("Nuevo vehículo registrado con éxito")}
      />
    </div>
  );
};

export default CameraSection;
