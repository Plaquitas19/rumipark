import React, { useState, useEffect } from "react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";

// Componente PlanCard para mostrar cada plan
const PlanCard = ({ title, price, description, features, onSelect }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-xl font-semibold text-center text-indigo-600 mb-4">
      {title}
    </h2>
    <p className="text-sm text-center text-gray-600 mb-6">{description}</p>
    <p className="text-3xl font-semibold text-center text-blue-900 mb-6">
      {price}
    </p>
    <ul className="mb-6 text-gray-700">
      {features.map((feature, index) => (
        <li key={index}>• {feature}</li>
      ))}
    </ul>
    {onSelect && (
      <div className="flex justify-center">
        <button
          onClick={onSelect}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700"
        >
          Seleccionar
        </button>
      </div>
    )}
  </div>
);

// Configuración de los planes con IDs del backend
const plans = [
  {
    id: 1,
    title: "Gratuito",
    price: "S/. 0.00/mes",
    description: "Plan inicial para usuarios nuevos.",
    features: ["Hasta 30 imágenes procesadas al mes.", "Funciones básicas."],
  },
  {
    id: 2,
    title: "Básico",
    price: "S/. 59.90/mes",
    description: "Ideal para pequeños negocios.",
    features: [
      "Hasta 100 imágenes procesadas al mes.",
      "Reportes básicos en PDF.",
    ],
  },
  {
    id: 3,
    title: "Premium",
    price: "S/. 199.99/mes",
    description: "Para negocios grandes o alta demanda.",
    features: [
      "Imágenes ilimitadas procesadas al mes.",
      "Reportes avanzados en PDF y Excel.",
    ],
  },
];

const PricingPlans = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null); // Para almacenar el ID de la preferencia
  const navigate = useNavigate();
  const userId = localStorage.getItem("id");

  // Función que se ejecuta cuando se selecciona un plan
  const handleSelectPlan = async (planId) => {
    if (!userId) return setShowLoginModal(true); // Mostrar modal si el usuario no está autenticado

    try {
      const response = await fetch(
        "https://CamiMujica.pythonanywhere.com/cambiar_plan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario_id: userId, plan_id: planId }), // Enviar id del usuario y plan seleccionado
        }
      );

      const data = await response.json();

      if (response.ok && data.init_point) {
        // Guardar el ID de la preferencia de pago
        setPreferenceId(data.init_point);
      } else {
        // Mostrar mensaje de error si no se pudo procesar el pago
        alert(data.error || "Error procesando el pago.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert(
        "Error al procesar el plan. Por favor, intenta de nuevo más tarde."
      );
    }
  };

  // Inicializar el botón de MercadoPago después de obtener la preferencia
  useEffect(() => {
    if (preferenceId) {
      if (!window.MercadoPago) {
        console.error("El SDK de Mercado Pago no se cargó correctamente.");
        return;
      }
      const mp = new window.MercadoPago(
        "TEST-b9171da0-16cd-40a5-b99a-1bf6c029d79a",
        {
          locale: "es-PE", // Puedes ajustar esto según el país
        }
      );

      mp.checkout({
        preference: {
          id: preferenceId, // Usar el ID de la preferencia generada en el backend
        },
        render: {
          container: "#button-checkout", // Contenedor donde se renderiza el botón de pago
          label: "Pagar con MercadoPago", // El texto del botón
        },
      });
    }
  }, [preferenceId]);

  return (
    <div className="bg-blue-50 min-h-screen">
      <Header />
      <div className="container mx-auto pt-12 px-4">
        <h1 className="text-3xl font-semibold text-center text-blue-800 mb-8">
          Elige el plan que mejor se adapte a tus necesidades
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              {...plan}
              onSelect={plan.id === 1 ? null : () => handleSelectPlan(plan.id)}
            />
          ))}
        </div>
      </div>

      {/* Botón de pago de Mercado Pago, solo aparece cuando se ha generado la preferencia */}
      <div id="button-checkout" className="flex justify-center mt-8"></div>

      {/* Modal para redirigir al login si el usuario no está autenticado */}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Inicia sesión</h2>
            <p className="mb-4 text-gray-600">
              Para seleccionar un plan, primero debes iniciar sesión.
            </p>
            <button
              onClick={() => navigate("/login")} // Redirigir al formulario de login
              className="bg-blue-600 text-white py-2 px-6 rounded-lg"
            >
              Ir al Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlans;
