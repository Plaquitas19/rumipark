import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

const detectarYVerificarPlaca = async (blob, userId) => {
  try {
    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");
    formData.append("id", userId);

    const response = await fetch(
      "https://rumipark-CamiMujica.pythonanywhere.com/detectar_y_verificar_y_entrada",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al enviar la solicitud a la API:", error);
    return { error: "Error al procesar la imagen" };
  }
};

const CameraDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [resultado, setResultado] = useState(null);
  const [detected, setDetected] = useState(false); // Para indicar si ya se detectó la placa

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
      }
    };

    startCamera();

    const intervalId = setInterval(async () => {
      if (detected) return; // Si ya se detectó la placa, dejamos de procesar

      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (canvas && video) {
          const context = canvas.getContext("2d");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const dataURL = canvas.toDataURL("image/jpeg");
          const blob = await fetch(dataURL).then((res) => res.blob());

          const userId = localStorage.getItem("id");
          const data = await detectarYVerificarPlaca(blob, userId);

          if (
            data &&
            (data.estado === "Placa registrada" ||
              data.estado === "Placa no registrada")
          ) {
            setResultado({
              mensaje: data.mensaje,
              estado: data.estado,
              placa_imagen: data.placa_imagen || null,
              placa_detectada:
                data.placa_detectada || "No se detectaron caracteres",
            });

            if (data.estado === "Placa registrada") {
              // Aquí es donde puedes realizar alguna acción, como la actualización del estado en la base de datos
              console.log(
                "Placa registrada con éxito, actualizando el sistema..."
              );
            } else {
              // Si la placa no estaba registrada, puedes dar la opción de registrar
              console.log("Placa no registrada, dando opción de registro...");
            }

            setDetected(true); // Detener la detección
          } else {
            setResultado({
              mensaje: "Error al procesar la imagen o no se detectaron placas.",
              estado: "Error",
              placa_imagen: null,
              placa_detectada: null,
            });
          }
        }
      } catch (err) {
        console.error("Error al procesar el cuadro:", err);
        setResultado({
          mensaje: "Error al procesar la imagen.",
          estado: "Error",
          placa_imagen: null,
          placa_detectada: null,
        });
      }
    }, 1000); // Capturar cada 1000ms (1 segundo)

    // Limpiar intervalos al desmontar el componente
    return () => {
      clearInterval(intervalId);
    };
  }, [detected]);

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
        </div>
      )}
    </div>
  );
};

export default CameraDetection;
