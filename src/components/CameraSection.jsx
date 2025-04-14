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
  const [hasPendingEntry, setHasPendingEntry] = useState(false);
  const [lastNotification, setLastNotification] = useState("");
  const [lastSpokenMessage, setLastSpokenMessage] = useState("");

  const speak = (message) => {
    if (lastSpokenMessage === message) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "es-ES";
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    setLastSpokenMessage(message);
  };

  useEffect(() => {
    let detectionInterval;
    if (isCameraActive) {
      detectionInterval = setInterval(() => {
        detectFromCamera();
      }, 5000);
    } else {
      clearInterval(detectionInterval);
    }

    return () => clearInterval(detectionInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive, hasPendingEntry]);

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
      setHasPendingEntry(false);
      setLastNotification("");
      setLastSpokenMessage("");
    }
  };

  const detectPlate = async (file) => {
    const userId = localStorage.getItem("id");

    if (!userId) {
      if (lastNotification !== "Usuario no autenticado") {
        toastr.error("Usuario no autenticado");
        speak("Usuario no autenticado");
        setLastNotification("Usuario no autenticado");
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", userId);

    try {
      const response = await fetch(
        "https://CamiMujica.pythonanywhere.com/detectar_y_verificar_y_entrada",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDetectedPlate(data.placa_detectada);
        setPlateImage(`data:image/jpeg;base64,${data.placa_imagen}`);

        if (data.estado === "Placa registrada") {
          setIsPlateRegistered(true);

          if (!data.entrada_registrada) {
            toastr.success("Placa detectada y entrada registrada.");
            speak("Placa detectada y entrada registrada");
            setLastNotification("Placa detectada y entrada registrada.");
            setHasPendingEntry(false);
          } else {
            // Eliminamos la notificación informativa y solo registramos la salida
            setHasPendingEntry(true);
            await registerExit(data.placa_detectada, userId);
          }

          try {
            const detailsResponse = await fetch(
              `https://CamiMujica.pythonanywhere.com/vehiculo/${data.placa_detectada}?id=${userId}`
            );
            const detailsData = await detailsResponse.json();

            if (detailsResponse.ok) {
              setVehicleDetails(detailsData);
            } else {
              setVehicleDetails(null);
              if (
                lastNotification !==
                "No se pudieron obtener los detalles del vehículo."
              ) {
                toastr.error(
                  "No se pudieron obtener los detalles del vehículo."
                );
                speak("No se pudieron obtener los detalles del vehículo");
                setLastNotification(
                  "No se pudieron obtener los detalles del vehículo."
                );
              }
            }
          } catch (err) {
            console.error("Error al obtener detalles del vehículo:", err);
            if (
              lastNotification !==
              "No se pudieron obtener los detalles del vehículo."
            ) {
              toastr.error("No se pudieron obtener los detalles del vehículo.");
              speak("No se pudieron obtener los detalles del vehículo");
              setLastNotification(
                "No se pudieron obtener los detalles del vehículo."
              );
            }
          }
        } else if (data.estado === "Placa no registrada") {
          setIsPlateRegistered(false);
          if (
            lastNotification !==
            "Placa no registrada. Por favor, registre el vehículo para procesar la entrada."
          ) {
            toastr.warning(
              "Placa no registrada. Por favor, registre el vehículo para procesar la entrada."
            );
            speak(
              "Placa no registrada. Por favor, registre el vehículo para procesar la entrada"
            );
            setLastNotification(
              "Placa no registrada. Por favor, registre el vehículo para procesar la entrada."
            );
          }
        }
      } else {
        if (lastNotification !== (data.mensaje || "No se detectaron placas.")) {
          toastr.error(data.mensaje || "No se detectaron placas.");
          speak(data.mensaje || "No某某 se detectaron placas");
          setLastNotification(data.mensaje || "No se detectaron placas.");
        }
      }
    } catch (err) {
      if (lastNotification !== "Error al procesar la imagen.") {
        toastr.error("Error al procesar la imagen.");
        speak("Error al procesar la imagen");
        setLastNotification("Error al procesar la imagen.");
        console.error("Error al enviar la imagen:", err);
      }
    }
  };

  const registerExit = async (plate, userId) => {
    try {
      const response = await fetch(
        "https://CamiMujica.pythonanywhere.com/salida",
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
        toastr.success("Salida registrada exitosamente.");
        speak("Salida registrada exitosamente");
        setLastNotification("Salida registrada exitosamente.");
        setHasPendingEntry(false);
      } else {
        const message = `Error: ${
          data.message || "No se pudo registrar la salida."
        }`;
        if (lastNotification !== message) {
          toastr.warning(message);
          speak(message);
          setLastNotification(message);
          console.error("Respuesta de error de la API:", data);
        }
      }
    } catch (err) {
      if (lastNotification !== "Error al intentar registrar la salida.") {
        toastr.error("Error al intentar registrar la salida.");
        speak("Error al intentar registrar la salida");
        setLastNotification("Error al intentar registrar la salida.");
        console.error("Error en el frontend:", err);
      }
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
      if (
        lastNotification !==
        "Debes activar la cámara para poder detectar la placa."
      ) {
        toastr.error("Debes activar la cámara para poder detectar la placa.");
        speak("Debes activar la cámara para poder detectar la placa");
        setLastNotification(
          "Debes activar la cámara para poder detectar la placa."
        );
      }
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
              {plateImage && (
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
                            setDetectedPlate(editablePlate);
                            setIsEditingPlate(false);

                            const userId = localStorage.getItem("id");
                            try {
                              const response = await fetch(
                                `https://CamiMujica.pythonanywhere.com/vehiculo/${editablePlate}?id=${userId}`
                              );

                              if (!response.ok) {
                                if (response.status === 404) {
                                  toastr.error(
                                    "La placa corregida no está registrada. Por favor, regístrala primero."
                                  );
                                  speak(
                                    "La placa corregida no está registrada. Por favor, regístrala primero"
                                  );
                                  setLastNotification(
                                    "La placa corregida no está registrada. Por favor, regístrala primero."
                                  );
                                  setIsPlateRegistered(false);
                                  return;
                                } else {
                                  toastr.error(
                                    "Error al verificar el estado de la placa."
                                  );
                                  speak(
                                    "Error al verificar el estado de la placa"
                                  );
                                  setLastNotification(
                                    "Error al verificar el estado de la placa."
                                  );
                                  return;
                                }
                              }
                              const data = await response.json();
                              setVehicleDetails(data);
                              setIsPlateRegistered(true);
                              toastr.success(
                                "Placa corregida y verificada. Ahora puedes registrar la entrada manualmente."
                              );
                              speak(
                                "Placa corregida y verificada. Ahora puedes registrar la entrada manualmente"
                              );
                            } catch (err) {
                              console.error(
                                "Error al procesar la placa editada:",
                                err
                              );
                              toastr.error(
                                "Hubo un problema al procesar la placa editada. Por favor, inténtalo más tarde."
                              );
                              speak(
                                "Hubo un problema al procesar la placa editada. Por favor, inténtalo más tarde"
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
