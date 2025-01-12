import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

const detectarYVerificarPlaca = async (blob, userId) => {
  try {
    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");
    formData.append("id", userId);

    const response = await fetch(
      "https://CamiMujica.pythonanywhere.com/detectar_y_verificar_y_entrada",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    console.log("Respuesta de la API:", data);
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
  }, []);

  const handleCapture = async () => {
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
          // Mostrar siempre los mismos datos: imagen y placa detectada
          setResultado({
            mensaje: data.mensaje,
            estado: data.estado,
            placa_imagen: data.placa_imagen || null,
            placa_detectada:
              data.placa_detectada || "No se detectaron caracteres",
          });
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
  };

  return (
    <div className="min-h-screen bg-light p-6">
      <header className="bg-primary text-white py-4 px-6 text-center text-lg font-bold">
        Detección de Placas
      </header>

      <div className="text-center">
        <video ref={videoRef} className="border rounded mb-4" />
        <canvas ref={canvasRef} className="d-none" width={640} height={480} />
        <button onClick={handleCapture} className="btn btn-primary">
          Detectar Placa
        </button>
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
