import React, { useState, useEffect, useRef, useCallback } from "react";
import NewVehicleModal from "./NewVehicleModal";
import "@fortawesome/fontawesome-free/css/all.css";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import debounce from "lodash/debounce";

const CameraSection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
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
  const [blockedPlates, setBlockedPlates] = useState({});
  const [recentEntries, setRecentEntries] = useState({});
  const [lastNotificationMessage, setLastNotificationMessage] = useState("");
  const readNotificationsRef = useRef(new Set());
  const [imageUsage, setImageUsage] = useState({ processed: 0, limit: 0 });
  const [isLoadingImageUsage, setIsLoadingImageUsage] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [bbox, setBbox] = useState(null);

  useEffect(() => {
    const fetchImageUsage = async () => {
      try {
        setIsLoadingImageUsage(true);
        const userId = localStorage.getItem("id");
        if (!userId) {
          console.error("No se encontró el ID del usuario en localStorage");
          return;
        }

        const response = await fetch(
          `https://rumipark-camimujica.pythonanywhere.com/imagenes_procesadas_total?id=${userId}`
        );
        const data = await response.json();

        if (response.ok) {
          setImageUsage({
            processed: data.imagenes_procesadas_total || 0,
            limit: data.limite_imagenes || 0,
          });
          if (
            data.mensaje &&
            data.mensaje.includes("Has alcanzado el límite")
          ) {
            showNotification(data.mensaje, "warning");
          }
        } else {
          console.error("Error al obtener el conteo de imágenes:", data.error);
          setImageUsage({ processed: 0, limit: 0 });
          showNotification(
            "Error al obtener el conteo de imágenes procesadas.",
            "error"
          );
        }
      } catch (err) {
        console.error("Error al obtener el conteo de imágenes:", err);
        setImageUsage({ processed: 0, limit: 0 });
        showNotification(
          "Error al obtener el conteo de imágenes procesadas.",
          "error"
        );
      } finally {
        setIsLoadingImageUsage(false);
      }
    };

    fetchImageUsage();
  }, []);

  const updateImageUsage = useCallback(
    debounce(async () => {
      try {
        setIsLoadingImageUsage(true);
        const userId = localStorage.getItem("id");
        if (!userId) {
          console.error("No se encontró el ID del usuario en localStorage");
          return;
        }

        const response = await fetch(
          `https://rumipark-camimujica.pythonanywhere.com/imagenes_procesadas_total?id=${userId}`
        );
        const data = await response.json();

        if (response.ok) {
          setImageUsage({
            processed: data.imagenes_procesadas_total || 0,
            limit: data.limite_imagenes || 0,
          });
          if (
            data.mensaje &&
            data.mensaje.includes("Has alcanzado el límite")
          ) {
            showNotification(data.mensaje, "warning");
          }
        } else {
          console.error(
            "Error al actualizar el conteo de imágenes:",
            data.error
          );
          setImageUsage({ processed: 0, limit: 0 });
          showNotification(
            "Error al actualizar el conteo de imágenes procesadas.",
            "error"
          );
        }
      } catch (err) {
        console.error("Error al actualizar el conteo de imágenes:", err);
        setImageUsage({ processed: 0, limit: 0 });
        showNotification(
          "Error al actualizar el conteo de imágenes procesadas.",
          "error"
        );
      } finally {
        setIsLoadingImageUsage(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    let detectionInterval;
    if (isCameraActive && !isDetecting) {
      detectionInterval = setInterval(() => {
        detectFromCamera();
      }, 2000);
    }
    return () => clearInterval(detectionInterval);
  }, [isCameraActive, isDetecting]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBlockedPlates((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((plate) => {
          if (now >= updated[plate]) {
            delete updated[plate];
          }
        });
        return updated;
      });
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && isCameraActive && bbox) {
      const context = canvas.getContext("2d");
      const drawBorder = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (bbox) {
          context.strokeStyle = "green";
          context.lineWidth = 4;
          context.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
        }
        if (isCameraActive) {
          requestAnimationFrame(drawBorder);
        }
      };
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      drawBorder();
    }
  }, [bbox, isCameraActive]);

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
      setBbox(null);
    }
  };

  const showNotification = (message, type) => {
    if (message !== lastNotificationMessage) {
      toastr.clear();
      toastr[type](message, "", { timeOut: 10000 });
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

    setIsDetecting(true);

    try {
      const response = await fetch(
        "https://rumipark-camimujica.pythonanywhere.com/detectar_y_verificar_y_entrada",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Respuesta de /detectar_y_verificar_y_entrada:", data);

      if (response.ok && data.placa_detectada) {
        const normalizedPlate = normalizePlate(data.placa_detectada);

        if (data.bbox) {
          console.log("Usando bbox de la API:", data.bbox);
          setBbox(data.bbox);
        } else {
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          const bboxWidth = videoWidth * 0.4;
          const bboxHeight = videoHeight * 0.2;
          const bboxX = (videoWidth - bboxWidth) / 2;
          const bboxY = videoHeight * 0.7;
          const fallbackBbox = {
            x: bboxX,
            y: bboxY,
            width: bboxWidth,
            height: bboxHeight,
          };
          console.log("Usando bbox de respaldo:", fallbackBbox);
          setBbox(fallbackBbox);
        }

        if (recentEntries[normalizedPlate]) {
          showNotification(
            `Entrada reciente para la placa ${normalizedPlate}. Debe esperar 3 minutos antes de registrar una nueva entrada o salida.`,
            "info"
          );
          return;
        }

        if (blockedPlates[normalizedPlate]) {
          showNotification(
            `Salida reciente para la placa ${normalizedPlate}. Debe esperar 2 minutos antes de registrar una nueva entrada.`,
            "info"
          );
          return;
        }

        if (data.estado === "Placa registrada") {
          setIsPlateRegistered(true);

          if (!data.entrada_registrada) {
            showNotification(
              `Placa detectada y entrada registrada para la placa ${normalizedPlate}.`,
              "success"
            );
            setRecentEntries((prev) => ({
              ...prev,
              [normalizedPlate]: Date.now() + 3 * 60 * 1000,
            }));
            await updateImageUsage();
          } else {
            showNotification(
              `El vehículo ya tiene una entrada registrada. Verificando salida para la placa ${normalizedPlate}...`,
              "info"
            );
            await registerExit(normalizedPlate, userId);
          }

          // Depuración detallada para la solicitud de detalles
          try {
            console.log(`Solicitando detalles para placa: ${normalizedPlate}, usuario: ${userId}`);
            const detailsResponse = await fetch(
              `https://rumipark-camimujica.pythonanywhere.com/vehiculo/${normalizedPlate}?id=${userId}`
            );
            console.log("Estado de la respuesta de /vehiculo:", detailsResponse.status);
            const detailsData = await detailsResponse.json();
            console.log("Datos de /vehiculo:", detailsData);

            if (detailsResponse.ok) {
              setVehicleDetails(detailsData);
              showNotification("Detalles del vehículo obtenidos con éxito.", "success");
            } else {
              console.error("Error en /vehiculo:", detailsData);
              setVehicleDetails(null);
              showNotification(
                `No se pudieron obtener los detalles del vehículo: ${detailsData.message || detailsData.error}`,
                "error"
              );
            }
          } catch (err) {
            console.error("Error al obtener detalles del vehículo:", err);
            setVehicleDetails(null);
            showNotification(
              `Error al obtener detalles del vehículo: ${err.message}`,
              "error"
            );
          }
        } else if (data.estado === "Placa no registrada") {
          setIsPlateRegistered(false);
          showNotification(
            "Placa no registrada. Por favor, registre el vehículo.",
            "warning"
          );
        } else if (data.estado === "Salida reciente") {
          setIsPlateRegistered(true);
          showNotification(
            `Salida reciente para la placa ${normalizedPlate}. Debe esperar 2 minutos antes de registrar una nueva entrada.`,
            "info"
          );
          try {
            console.log(`Solicitando detalles para placa (salida reciente): ${normalizedPlate}, usuario: ${userId}`);
            const detailsResponse = await fetch(
              `https://rumipark-camimujica.pythonanywhere.com/vehiculo/${normalizedPlate}?id=${userId}`
            );
            console.log("Estado de la respuesta de /vehiculo (salida reciente):", detailsResponse.status);
            const detailsData = await detailsResponse.json();
            console.log("Datos de /vehiculo (salida reciente):", detailsData);
            if (detailsResponse.ok) {
              setVehicleDetails(detailsData);
            } else {
              console.error("Error en /vehiculo (salida reciente):", detailsData);
              setVehicleDetails(null);
              showNotification(
                `No se pudieron obtener los detalles del vehículo: ${detailsData.message || detailsData.error}`,
                "error"
              );
            }
          } catch (err) {
            console.error("Error al obtener detalles del vehículo (salida reciente):", err);
            setVehicleDetails(null);
            showNotification(
              `Error al obtener detalles del vehículo: ${err.message}`,
              "error"
            );
          }
        }

        setDetectedPlate(normalizedPlate);
        setPlateImage(`data:image/jpeg;base64,${data.placa_imagen}`);
      } else {
        setDetectedPlate("");
        setPlateImage(null);
        setIsPlateRegistered(null);
        setVehicleDetails(null);
        setBbox(null);
        showNotification(
          data.error || data.mensaje || "Error al procesar la imagen.",
          "error"
        );
      }
    } catch (err) {
      setDetectedPlate("");
      setPlateImage(null);
      setIsPlateRegistered(null);
      setVehicleDetails(null);
      setBbox(null);
      showNotification("Error al procesar la imagen: " + err.message, "error");
      console.error("Error al enviar la imagen:", err);
    } finally {
      setIsDetecting(false);
    }
  };

  const registerExit = async (plate, userId) => {
    try {
      if (recentEntries[plate]) {
        showNotification(
          `Entrada reciente para la placa ${plate}. Debe esperar 3 minutos antes de registrar una salida.`,
          "info"
        );
        return;
      }

      const response = await fetch(
        "https://rumipark-camimujica.pythonanywhere.com/salida",
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
      console.log("Respuesta de /salida:", data);

      if (
        data.message &&
        typeof data.message === "string" &&
        data.message.includes("3 minutos")
      ) {
        showNotification(
          `Entrada reciente para la placa ${plate}. Debe esperar 3 minutos antes de registrar una salida.`,
          "info"
        );
        return;
      }

      if (response.ok && data.message === "Salida registrada exitosamente.") {
        setVehicleDetails(data.vehiculo);
        showNotification(
          `Salida registrada para la placa ${plate}.`,
          "success"
        );
        setBlockedPlates((prev) => ({
          ...prev,
          [plate]: Date.now() + 2 * 60 * 1000,
        }));
        setRecentEntries((prev) => {
          const updated = { ...prev };
          delete updated[plate];
          return updated;
        });
        await updateImageUsage();
      } else {
        showNotification(
          `Error al registrar la salida: ${
            data.error || data.message || "Error desconocido en el servidor"
          }`,
          "error"
        );
      }
    } catch (err) {
      showNotification(
        `Error al intentar registrar la salida: ${err.message}`,
        "error"
      );
      console.error("Error en el frontend:", err);
      await updateImageUsage();
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
    if (isDetecting) {
      console.log("Detección en curso, omitiendo captura...");
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
            <canvas
              ref={canvasRef}
              className="absolute w-auto h-full object-cover rounded-lg pointer-events-none"
              style={{ opacity: bbox ? 1 : 0 }}
            ></canvas>
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
            <div className="text-center mb-4">
              {isLoadingImageUsage ? (
                <p className="text-lg font-semibold text-gray-500">
                  Cargando...
                </p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-700">
                    Placas procesadas: {imageUsage.processed}/{imageUsage.limit}
                  </p>
                  {imageUsage.processed >= imageUsage.limit &&
                    imageUsage.limit !== 0 && (
                      <p className="text-sm text-red-500">
                        Has alcanzado el límite de imágenes de tu plan.
                      </p>
                    )}
                </>
              )}
            </div>
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
              {plateImage && detectedPlate && (
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
                                `https://rumipark-camimujica.pythonanywhere.com/vehiculo/${normalizedEditablePlate}?id=${userId}`
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
                  {vehicleDetails && detectedPlate && isPlateRegistered && (
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
                              {vehicleDetails.tipo_vehiculo || "No disponible"}
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
                              {vehicleDetails.propietario || "No disponible"}
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
                              {vehicleDetails.dni || "No disponible"}
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
