import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";
import fondo from "../assets/fondo-login.png";
import icono from "../assets/icono.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = "https://CamiMujica.pythonanywhere.com/usuarios";

  // Manejar inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("id", data.id);
        localStorage.setItem("plan_id", data.plan_id);
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          navigate("/dashboard/main");
        }, 2000);
      } else {
        const errorData = await response.json();
        toastr.error(errorData.message || "Credenciales incorrectas");
      }
    } catch (error) {
      toastr.error("Error de conexión con el servidor");
    }
  };

  // Manejar registro de usuario
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        toastr.success(
          "Usuario registrado exitosamente. Ahora puedes iniciar sesión."
        );
        setIsRegistering(false);
      } else {
        const errorData = await response.json();
        toastr.error(errorData.message || "Error al registrar el usuario");
      }
    } catch (error) {
      toastr.error("Error de conexión con el servidor");
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin3D {
            0% {
              transform: perspective(1000px) rotateY(0deg);
            }
            100% {
              transform: perspective(1000px) rotateY(360deg);
            }
          }
          .animate-3d-spin {
            animation: spin3D 4s linear infinite;
            transform-style: preserve-3d;
          }
          .animate-3d-spin:hover {
            animation-play-state: paused;
          }
        `}
      </style>
      <div
        className="h-screen flex flex-col lg:flex-row bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fondo})` }}
      >
        {/* Panel izquierdo */}
        <div className="lg:w-1/2 w-full flex justify-center items-center p-4 relative">
          <Link to="/">
            <img
              src={icono}
              alt="Logo"
              className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain cursor-pointer animate-3d-spin"
            />
          </Link>
        </div>

        {/* Panel derecho */}
        <div className="lg:w-1/2 w-full flex flex-col justify-center items-center px-4 py-6 md:py-8">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-10 text-center"
            style={{ color: "#167f9f" }}
          >
            {isRegistering ? "Registrarse" : "Iniciar sesión"}
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#167f9f]"></div>
            </div>
          ) : (
            <form
              onSubmit={isRegistering ? handleRegister : handleLogin}
              className="space-y-4 md:space-y-6 w-full max-w-xs sm:max-w-sm md:max-w-md bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg"
            >
              {isRegistering && (
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="absolute left-4 top-5"
                    style={{ color: "#167f9f" }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    className="w-full pl-14 pr-5 py-3 text-lg border-2 rounded-md shadow-sm bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
                    style={{ borderColor: "#167f9f" }}
                  />
                </div>
              )}
              <div className="relative">
                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-4 top-5"
                  style={{ color: "#167f9f" }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  className="w-full pl-14 pr-5 py-3 text-lg border-2 rounded-md shadow-sm bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
                  style={{ borderColor: "#167f9f" }}
                />
              </div>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-5"
                  style={{ color: "#167f9f" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full pl-14 pr-10 py-3 text-lg border-2 rounded-md shadow-sm bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
                  style={{ borderColor: "#167f9f" }}
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="absolute right-4 top-5 cursor-pointer"
                  style={{ color: "#167f9f" }}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 text-white text-lg font-bold rounded-lg transition"
                style={{
                  backgroundColor: "#167f9f",
                  boxShadow: "0 4px 10px rgba(22, 127, 159, 0.8)",
                }}
              >
                {isRegistering ? "Registrarse" : "Ingresar"}
              </button>
            </form>
          )}

          <button
            className="mt-6 text-lg underline"
            style={{ color: "#167f9f" }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering
              ? "¿Ya tienes cuenta? Inicia sesión aquí"
              : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>
      </div>
    </>
  );
}

export default Login;
