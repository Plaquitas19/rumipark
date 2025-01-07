import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";
import fondo from "../assets/fondo-login.png";
import icono from "../assets/icono.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash, faEnvelope } from "@fortawesome/free-solid-svg-icons";

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  
        // Guardar los datos del usuario en localStorage
        localStorage.setItem("auth_token", data.token); 
        localStorage.setItem("username", data.username);  // Guardamos el nombre de usuario
        localStorage.setItem("id", data.id);
        localStorage.setItem("plan_id", data.plan_id);
  
        toastr.success("Inicio de sesión exitoso");
  
        // Redirigir a /dashboard/main
        navigate("/dashboard/main");
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
        toastr.success("Usuario registrado exitosamente. Ahora puedes iniciar sesión.");
        setIsRegistering(false); // Cambiar de nuevo a la vista de inicio de sesión
      } else {
        const errorData = await response.json();
        toastr.error(errorData.message || "Error al registrar el usuario");
      }
    } catch (error) {
      toastr.error("Error de conexión con el servidor");
    }
  };

  return (
    <div
      className="h-screen flex flex-col lg:flex-row bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      {/* Panel izquierdo */}
      <div className="lg:w-1/2 w-full flex justify-center items-center p-4">
        <img
          src={icono}
          alt="Logo"
          className="w-64 h-64 md:w-96 md:h-96 lg:w-128 lg:h-128 object-contain"
        />
      </div>

      {/* Panel derecho */}
      <div className="lg:w-1/2 w-full flex flex-col justify-center items-center px-4">
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-10 text-center"
          style={{ color: "#1da4cf" }}
        >
          {isRegistering ? "Registrarse" : "Iniciar sesión"}
        </h2>
        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="space-y-6 md:space-y-8 w-full max-w-xs md:max-w-sm lg:max-w-md bg-white p-6 md:p-8 rounded-lg shadow-lg"
        >
          {isRegistering && (
            <div className="relative">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="absolute left-4 top-4"
                style={{ color: "#1da4cf" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full pl-14 pr-5 py-3 md:py-4 text-lg border-2 rounded-md shadow-sm bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
                style={{ borderColor: "#1da4cf" }}
              />
            </div>
          )}
          <div className="relative">
            <FontAwesomeIcon
              icon={faUser}
              className="absolute left-4 top-4"
              style={{ color: "#1da4cf" }}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              className="w-full pl-14 pr-5 py-3 md:py-4 text-lg border-2 rounded-md shadow-sm bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
              style={{ borderColor: "#1da4cf" }}
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon
              icon={faLock}
              className="absolute left-4 top-4"
              style={{ color: "#1da4cf" }}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full pl-14 pr-10 py-3 md:py-4 text-lg border-2 rounded-md shadow-sm bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-4 focus:outline-none"
              style={{ borderColor: "#1da4cf" }}
            />
            <FontAwesomeIcon
              icon={showPassword ? faEyeSlash : faEye}
              className="absolute right-4 top-4 cursor-pointer"
              style={{ color: "#1da4cf" }}
              onClick={() => setShowPassword(!showPassword)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 md:py-4 text-white text-lg md:text-xl font-bold rounded-lg transition"
            style={{ backgroundColor: "#1da4cf" }}
          >
            {isRegistering ? "Registrarse" : "Ingresar"}
          </button>
        </form>
        <button
          className="mt-8 text-base md:text-lg underline"
          style={{ color: "#1da4cf" }}
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "¿Ya tienes cuenta? Inicia sesión aquí" : "¿No tienes cuenta? Regístrate aquí"}
        </button>
      </div>
    </div>
  );
}

export default Login;
