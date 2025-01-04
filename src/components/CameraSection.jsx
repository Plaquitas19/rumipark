import React, { useRef, useState } from "react";
import NewVehicleModal from "./NewVehicleModal";

// Asegúrate de haber instalado y agregado Font Awesome
import '@fortawesome/fontawesome-free/css/all.css';

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
  const [exitObservation, setExitObservation] = useState("");
  



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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

  const detectPlate = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await fetch("https://CamiMujica.pythonanywhere.com/detectar_y_verificar", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Error al procesar la imagen en el modelo.");
      }
  
      const data = await response.json();
  
      if (data.estado === "Placa registrada" || data.estado === "Placa no registrada") {
        setDetectedPlate(data.placa_detectada);
        setPlateImage(`data:image/jpeg;base64,${data.placa_imagen}`);
        setIsPlateRegistered(data.estado === "Placa registrada");
  
        // Ahora que tenemos la placa detectada, hacemos la solicitud para obtener los detalles
        const detailsResponse = await fetch(`https://CamiMujica.pythonanywhere.com/vehiculo/${data.placa_detectada}`);
        const detailsData = await detailsResponse.json();
  
        if (detailsResponse.ok) {
          setVehicleDetails(detailsData);  // Guardamos los detalles en el estado
        } else {
          setVehicleDetails(null);  // En caso de error, limpiamos el estado de detalles
        }
      } else {
        setError("No se detectaron placas.");
      }
  
    } catch (err) {
      console.error("Error al enviar la imagen:", err);
      setError("Error al procesar la imagen para detectar la placa.");
    }
  };
  


  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      detectPlate(file);
    }
  };

  const detectFromCamera = async () => {
    if (videoRef.current) {
      const video = videoRef.current;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL("image/jpeg");
      const file = dataURLToFile(imageData, "captura.jpg");

      detectPlate(file);
    }
  };

  const registerEntry = async () => {
    if (!detectedPlate) {
        alert("No hay una placa detectada para registrar.");
        return;
    }

    // Verificar si la placa está registrada
    if (isPlateRegistered === false) {
        alert("La placa no está registrada. No puedes registrar la entrada.");
        return;
    }

    try {
        // Llamar al nuevo endpoint de la API que maneja ambos procesos de verificación y registro
        const response = await fetch("https://CamiMujica.pythonanywhere.com/entrada", { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ numero_placa: detectedPlate }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.entrada_registrada) {
                alert("El vehículo ya tiene una entrada registrada. Por favor, registre la salida.");
            } else {
                alert(data.message || "Entrada registrada exitosamente.");
            }
        } else {
            alert(data.message || "Error al registrar la entrada.");
        }
    } catch (err) {
        console.error("Error al registrar la entrada:", err);
        alert("Error al registrar la entrada.");
    }
};


  

const registerExit = async () => {
  if (!detectedPlate) {
    alert("No hay una placa detectada para registrar.");
    return;
  }

  try {
    // Verificar si la placa detectada es válida
    const response = await fetch("https://CamiMujica.pythonanywhere.com/salida", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        numero_placa: detectedPlate, 
        observacion: exitObservation || "Sin observación" // Incluye la observación o un valor predeterminado
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message || "Salida registrada exitosamente.");
      setExitObservation(""); // Limpia el campo de observación tras éxito
    } else {
      alert(data.message || "No se puede registrar la salida. " + (data.error || ""));
    }
  } catch (err) {
    console.error("Error al registrar la salida:", err);
    alert("Error al registrar la salida.");
  }
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
              <p className="text-white text-center">Esperando cámara en vivo...</p>
            )}
            <video
              ref={videoRef}
              className="absolute w-auto h-full object-cover rounded-lg"
            ></video>
          </div>

          <div className="flex justify-between w-full mt-4 px-4">
            <button
              className="px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
              onClick={() => setIsNewVehicleModalOpen(true)}
            >
              <i className="fas fa-car-side mr-2"></i>Nuevo Registro
            </button>
            <button
              className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
              onClick={registerEntry}
            >
              <i className="fas fa-sign-in-alt mr-2"></i>Registrar Entrada
            </button>
            <button
              className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800"
              onClick={registerExit}
            >
              <i className="fas fa-sign-out-alt mr-2"></i>Registrar Salida
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="p-4 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCameraToggle}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                >
                  <i className={`fas ${isCameraActive ? 'fa-camera-slash' : 'fa-camera'} mr-2`}></i>
                  {isCameraActive ? "Desactivar cámara" : "Activar cámara"}
                </button>
                <button
                  onClick={detectFromCamera}
                  className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                >
                  <i className="fas fa-video mr-2"></i>Detectar Placa
                </button>
                <label
                  className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 cursor-pointer"
                >
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
                <p className={`text-${isPlateRegistered ? 'green' : 'red'}-500 font-semibold`}>
                  {isPlateRegistered ? "Placa registrada" : "Placa no registrada"}
                </p>
                <img
                  src={plateImage}
                  alt="Placa detectada"
                  className="w-48 h-auto border-4 border-gray-300 rounded-xl shadow-md mt-4"
                />
                <p className="mt-2 font-bold text-lg">{detectedPlate}</p>

                {/* Detalles del vehículo */}
                {vehicleDetails && (
                  <div className="mt-6 bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 space-y-4">
                    <h3 className="text-xl font-semibold text-gray-700">Detalles del Vehículo</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="font-bold text-blue-800">Tipo de Vehículo:</p>
                        <p className="bg-blue-100 text-blue-800 font-semibold rounded-md px-4 py-2">{vehicleDetails.tipo_vehiculo}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="font-bold text-blue-800">Propietario:</p>
                        <p className="bg-blue-100 text-blue-800 font-semibold rounded-md px-4 py-2">{vehicleDetails.propietario}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="font-bold text-blue-800">DNI:</p>
                        <p className="bg-blue-100 text-blue-800 font-semibold rounded-md px-4 py-2">{vehicleDetails.dni}</p>
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
