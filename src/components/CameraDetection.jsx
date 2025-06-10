import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

const normalizePlate = (plate) => {
  return plate
    .replace(/[-_\s]/g, "") // Elimina guiones, espacios y guiones bajos
    .toUpperCase()
    .trim(); // Elimina espacios al inicio o final
};

const detectarYVerificarPlaca = async (blob, userId, retries = 2) => {
  const formData = new FormData();
  formData.append("file", blob, "photo.jpg");
  formData.append("id", userId);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        "https://rumipark-CamiMujica.pythonanywhere.com/detectar_y_verificar_y_entrada",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (
        response.ok &&
        data.placa_detectada &&
        /^[A-Z0-9]{6,7}$/.test(normalizePlate(data.placa_detectada))
      ) {
        return data;
      } else {
        if (attempt === retries) {
          return { error: data.mensaje || "No se detectaron placas válidas." };
        }
      }
    } catch (error) {
      if (attempt === retries) {
        return { error: "Error al procesar la imagen." };
      }
    }
  }
};

const CameraDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [resultado, setResultado] = useState(null);
  const [recentPlates, setRecentPlates] = useState({}); // Bloqueo de placas recientes (3 minutos)

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current.play();
        }
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        toastr.error("No se pudo acceder a la cámara. Verifica los permisos.");
      }
    };

    startCamera();

    const intervalId = setInterval(async () => {
      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (canvas && video) {
          const context = canvas.getContext("2d");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const dataURL = canvas.toDataURL("image/jpeg");
          const blob = await fetch(dataURL).then((res) => res.blob());

          const userId = localStorage.getItem("id");
          if (!userId) {
            toastr.error("Usuario no autenticado.");
            return;
          }

          const now = Date.now();
          // Limpiar placas recientes
          setRecentPlates((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((plate) => {
              if (now >= updated[plate]) {
                delete updated[plate];
              }
            });
            return updated;
          });

          const data = await detectarYVerificarPlaca(blob, userId);
          if (data.error) {
            setResultado({
              mensaje: data.error,
              estado: "Error",
              placa_imagen: null,
              placa_detectada: null,
            });
            toastr.error(data.error);
            return;
          }

          const normalizedPlate = normalizePlate(data.placa_detectada);
          // Verificar si la placa está bloqueada
          if (recentPlates[normalizedPlate]) {
            toastr.info(
              `Placa ${normalizedPlate} detectada recientemente. Espera 3 minutos.`
            );
            return;
          }

          // Usar los datos de la respuesta directamente
          if (data.estado === "Placa registrada" && data.vehiculo) {
            setResultado({
              mensaje: data.mensaje || "Placa registrada.",
              estado: "Placa registrada",
              placa_imagen: data.placa_imagen || null,
              placa_detectada: normalizedPlate,
              detalles: data.vehiculo, // Usar el campo vehiculo directamente
            });
            toastr.success("Placa registrada.");
          } else {
            setResultado({
              mensaje:
                data.mensaje ||
                "Placa no registrada. Por favor, registre el vehículo.",
              estado: "Placa no registrada",
              placa_imagen: data.placa_imagen || null,
              placa_detectada: normalizedPlate,
              detalles: null,
            });
            toastr.warning(
              "Placa no registrada. Por favor, registre el vehículo."
            );
          }

          // Bloquear la placa por 3 minutos
          setRecentPlates((prev) => ({
            ...prev,
            [normalizedPlate]: now + 3 * 60 * 1000, // 3 minutos
          }));
        }
      } catch (err) {
        console.error("Error al procesar el cuadro:", err);
        setResultado({
          mensaje: "Error al procesar la imagen.",
          estado: "Error",
          placa_imagen: null,
          placa_detectada: null,
        });
        toastr.error("Error al procesar la imagen.");
      }
    }, 2000); // Capturar cada 2 segundos

    return () => {
      clearInterval(intervalId);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recentPlates]);

  return (
    <div className="min-h-screen bg-light p-6">
      <header className="bg-primary text-white py-4 px-6 text-center text-lg font-bold">
        Detección de Placas
      </header>

      <div className="text-center">
        <video ref={videoRef} className="border rounded mb-4" />
        <canvas ref={canvasRef} className="d-none" width={640} height={480} />
      </div>

      {resultado && (
        <div className="mt-5 p-4 border rounded shadow bg-white">
          <h5>{resultado.mensaje}</h5>
          {resultado.placa_imagen && (
            <img
              src={`data:image/jpeg;base64,${resultado.placa_imagen}`}
              alt="Placa detectada"
              className="img-fluid mt-3 border rounded"
            />
          )}
          {resultado.placa_detectada && (
            <p className="mt-3">
              <strong>Placa detectada:</strong> {resultado.placa_detectada}
            </p>
          )}
          {resultado.detalles && (
            <div className="mt-4">
              <h6>Detalles del Vehículo</h6>
              <p>
                <strong>Tipo:</strong> {resultado.detalles.tipo_vehiculo}
              </p>
              <p>
                <strong>Propietario:</strong> {resultado.detalles.propietario}
              </p>
              <p>
                <strong>DNI:</strong> {resultado.detalles.dni}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraDetection;
