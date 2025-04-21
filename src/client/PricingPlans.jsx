import React, { useState } from "react";
import Header from "./Header";
import { useNavigate } from "react-router-dom";

const PlanCard = ({ title, price, description, features, icon, rotate }) => (
  <div
    className={`bg-white rounded-xl p-8 flex flex-col items-center text-black shadow-lg border-2 border-blue-400 transform transition-all duration-300 hover:scale-105 ${rotate}`}
  >
    <div className="text-5xl mb-4 text-blue-500">{icon}</div>
    <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>
    <p className="text-sm text-center mb-4">{description}</p>
    <p className="text-4xl font-bold text-center mb-6">{price}</p>
    <ul className="mb-6 text-center space-y-2">
      {features.map((feature, index) => (
        <li key={index}>• {feature}</li>
      ))}
    </ul>
  </div>
);

const InfoCard = ({ icon, title, description }) => (
  <div className="bg-white rounded-xl p-6 flex flex-col items-center text-black shadow-lg border-2 border-blue-400 transform transition-all duration-300 hover:scale-105">
    <div className="text-4xl mb-4 text-blue-500">{icon}</div>
    <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>
    <p className="text-sm text-center">{description}</p>
  </div>
);

// Configuración de los planes
const plans = [
  {
    id: 1,
    title: "Gratuito",
    price: "S/. 0.00/mes",
    description: "Ideal para pequeñas instalaciones.",
    features: [
      "Detección de hasta 30 placas al mes.",
      "Registro básico de entradas y salidas.",
      "Alertas de vehículos no autorizados.",
      "Soporte por correo electrónico.",
    ],
    icon: "📷",
    rotate: "-rotate-3",
  },
  {
    id: 2,
    title: "Básico",
    price: "S/. 59.90/mes",
    description: "Perfecto para parkings medianos.",
    features: [
      "Detección de hasta 100 placas al mes.",
      "Registro detallado de entradas y salidas.",
      "Reportes básicos en PDF.",
      "Soporte por correo y chat.",
    ],
    icon: "🚗",
    rotate: "rotate-0",
  },
  {
    id: 3,
    title: "Premium",
    price: "S/. 199.99/mes",
    description: "Para empresas con alta demanda.",
    features: [
      "Detección ilimitada de placas.",
      "Registro avanzado con historial completo.",
      "Reportes avanzados en PDF y Excel.",
      "Soporte prioritario 24/7.",
    ],
    icon: "🔒",
    rotate: "rotate-3",
  },
];

// Características principales
const infoSections = [
  {
    icon: "📸",
    title: "Detección de placas",
    description:
      "Reconoce placas vehiculares en tiempo real con alta precisión.",
  },
  {
    icon: "🚦",
    title: "Registro automático",
    description: "Registra entradas y salidas de vehículos automáticamente.",
  },
  {
    icon: "🛡️",
    title: "Seguridad mejorada",
    description: "Recibe alertas instantáneas de vehículos no autorizados.",
  },
];

// Beneficios
const benefits = [
  {
    icon: "✅",
    title: "Mejora la seguridad",
    description:
      "Identifica vehículos no autorizados con alertas instantáneas.",
  },
  {
    icon: "⚡",
    title: "Aumenta la eficiencia",
    description: "Automatiza el registro y elimina procesos manuales.",
  },
  {
    icon: "💰",
    title: "Reduce costos",
    description: "Optimiza la gestión y reduce gastos operativos.",
  },
];

// Casos de uso
const useCases = [
  {
    icon: "🅿️",
    title: "Parkings comerciales",
    description: "Controla el acceso y genera reportes de ocupación.",
  },
  {
    icon: "🚛",
    title: "Empresas de logística",
    description: "Monitorea camiones y optimiza rutas.",
  },
  {
    icon: "🏢",
    title: "Edificios residenciales",
    description: "Garantiza la seguridad de los residentes.",
  },
];

const PricingPlans = () => {
  // eslint-disable-next-line no-unused-vars
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const userId = localStorage.getItem("id");

  return (
    <div className="bg-gradient-to-b from-white to-blue-200 min-h-screen">
      <Header />
      <div className="container mx-auto pt-12 px-4">
        {/* Encabezado */}
        <div className="text-center mb-12 bg-white py-8 rounded-xl shadow-lg">
          <div className="inline-block bg-blue-200 text-black text-sm font-semibold px-4 py-1 rounded-full mb-4">
            RUMIPARK
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">
            Elige el plan perfecto para tu gestión vehicular
          </h1>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Detecta placas, registra entradas y salidas, y optimiza la seguridad
            de tus instalaciones con Rumipark.
          </p>
        </div>

        {/* Planes */}
        <div className="bg-blue-100 rounded-xl py-12 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <PlanCard key={plan.id} {...plan} />
            ))}
          </div>
        </div>

        {/* Características principales */}
        <div className="bg-white rounded-xl py-20 mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-black mb-10 pb-4 border-b-2 border-blue-300">
              ¿Por qué elegir Rumipark?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {infoSections.map((section, index) => (
                <InfoCard key={index} {...section} />
              ))}
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="bg-blue-100 rounded-xl py-20 mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-black mb-10 pb-4 border-b-2 border-blue-300">
              Beneficios de usar Rumipark
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <InfoCard key={index} {...benefit} />
              ))}
            </div>
          </div>
        </div>

        {/* Casos de uso */}
        <div className="bg-white rounded-xl py-20 mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-black mb-10 pb-4 border-b-2 border-blue-300">
              Casos de uso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <InfoCard key={index} {...useCase} />
              ))}
            </div>
          </div>
        </div>

        {/* Llamado a la acción */}
        <div className="text-center py-12 bg-blue-300 rounded-xl max-w-5xl mx-auto mb-16 shadow-lg">
          <h2 className="text-4xl font-bold text-black mb-4">
            ¡Optimiza tu gestión vehicular hoy!
          </h2>
          <p className="text-lg text-black mb-6 max-w-2xl mx-auto">
            Prueba Rumipark y mejora la seguridad y eficiencia de tus
            instalaciones con nuestra tecnología avanzada.
          </p>
          <a
            href="https://wa.me/1234567890?text=Hola,%20quiero%20información%20sobre%20los%20planes%20de%20Rumipark"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-8 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors duration-300 text-lg font-semibold"
          >
            Contáctanos ahora
          </a>
        </div>
      </div>

      {/* Ícono de WhatsApp flotante */}
      <a
        href="https://wa.me/1234567890?text=Hola,%20quiero%20información%20sobre%20los%20planes%20de%20Rumipark"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-300 flex items-center animate-pulse"
      >
        <span className="text-2xl mr-2">📞</span>
        <span className="text-sm font-semibold">Contacta con nosotros</span>
      </a>

      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Inicia sesión
            </h2>
            <p className="mb-4 text-gray-500 text-center">
              Para seleccionar un plan, primero debes iniciar sesión.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlans;
