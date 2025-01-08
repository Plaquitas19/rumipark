import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

const detectarYVerificarPlaca = async (blob, userId) => {
  try {
    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");

    // Enviar la solicitud a la API, incluyendo el id del usuario
    const response = await fetch(
      "https://CamiMujica.pythonanywhere.com/detectar_y_verificar",
      {
        method: "POST",
        body: formData,
        headers: {
          "id": userId,  // Pasa el id del usuario en los headers
        },
      }
    );

    const data = await response.json();
    if (response.ok) {
      // Si la respuesta es positiva, devolver los detalles de la placa detectada
      return {
        estado: data.estado, 
        placa_detectada: data.placa_detectada,
        placa_imagen: data.placa_imagen,
        vehiculo_id: data.vehiculo_id,  // Devuelves el vehiculo_id si la placa está registrada
      };
    } else {
      console.error("Error en la API:", data.error);
      return { estado: "Error en la detección de la placa" };
    }
  } catch (error) {
    console.error("Error al enviar la solicitud a la API:", error);
    return { estado: "Error al procesar la imagen" };
  }
};


const CameraDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [resultados, setResultados] = useState({});
  const [modalVisible, setModalVisible] = useState(false); // Controla la visibilidad del modal
  const [mensajePlaca, setMensajePlaca] = useState("");
  const [colorModal, setColorModal] = useState(""); // Controla el color del mensaje en el modal

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

        const data = await detectarYVerificarPlaca(blob);
        setResultados(data);

        if (data.estado === "Placa registrada") {
          setMensajePlaca("La placa está registrada.");
          setColorModal("text-success"); // Verde si la placa está registrada
        } else if (data.estado === "Placa no registrada") {
          setMensajePlaca("La placa no está registrada.");
          setColorModal("text-danger"); // Rojo si no está registrada
        } else {
          setMensajePlaca("Error al procesar la placa.");
          setColorModal("text-warning"); // Amarillo si hay errores
        }

        setModalVisible(true); // Mostrar modal
      }
    } catch (err) {
      console.error("Error al procesar el cuadro:", err);
      setMensajePlaca("Error al procesar la imagen.");
      setColorModal("text-danger");
      setModalVisible(true); // Mostrar modal en caso de error
    }
  };

  return (
    <div className="min-h-screen bg-light p-6 flex flex-column align-items-center">
      <header className="bg-primary text-white py-4 px-6 text-center text-lg font-bold w-100 mb-4">
        RUMIPARK - Detección de Placas
      </header>

      {/* Video y Captura */}
      <div className="text-center">
        <video ref={videoRef} className="border rounded mb-4" />
        <canvas ref={canvasRef} className="d-none" width={640} height={480} />
        <button onClick={handleCapture} className="btn btn-primary">
          Detectar Placa
        </button>
      </div>

      {/* Modal Bootstrap */}
      <div
        className={`modal fade ${modalVisible ? "show d-block" : ""}`}
        style={modalVisible ? { display: "block" } : { display: "none" }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Resultado de la detección</h5>
              <button
                type="button"
                className="close"
                onClick={() => setModalVisible(false)}
              >
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <p className={colorModal}>{mensajePlaca}</p>
              {resultados.placa_imagen && (
                <img
                  src={`data:image/jpeg;base64,${resultados.placa_imagen}`}
                  alt="Placa detectada"
                  className="img-fluid mt-3 border"
                />
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalVisible(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraDetection;
