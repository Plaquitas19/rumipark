import React from "react";
import Header from "./Header";

const PricingPlans = () => {
  return (
    <div className="bg-blue-50 min-h-screen">
      {/* Usar el componente Header aquí */}
      <Header />

      {/* Contenido */}
      <div className="flex justify-center items-center px-4">
        <div className="container mx-auto pt-12 md:pt-24 px-4">
          <h1 className="text-3xl lg:text-4xl font-semibold text-center text-blue-800 mb-8 animate__animated animate__fadeInUp">
            Elige el plan que mejor se adapte a tus necesidades
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan Gratuito */}
            <div className="bg-white rounded-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl p-6 ease-in-out duration-300">
              <h2 className="text-xl font-semibold text-center text-indigo-600 mb-4">
                Gratuito
              </h2>
              <p className="text-sm text-center text-gray-600 mb-6">
                Plan inicial para usuarios nuevos que desean probar las
                funcionalidades básicas.
              </p>
              <p className="text-3xl font-semibold text-center text-blue-900 mb-6">
                S/. 0.00/mes
              </p>
              <ul className="mb-6 space-y-2 text-gray-700">
                <li>• Hasta 30 imágenes procesadas al mes.</li>
                <li>• Botón de Subir Imagen habilitado.</li>
                <li>• Funciones limitadas y sin reportes.</li>
              </ul>
              <div className="flex justify-center">
                <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transform transition-all duration-200 ease-in-out">
                  Seleccionar
                </button>
              </div>
            </div>

            {/* Plan Básico */}
            <div className="bg-white rounded-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl p-6 ease-in-out duration-300">
              <h2 className="text-xl font-semibold text-center text-indigo-600 mb-4">
                Básico
              </h2>
              <p className="text-sm text-center text-gray-600 mb-6">
                Plan intermedio diseñado para pequeños negocios con mayor
                actividad.
              </p>
              <p className="text-3xl font-semibold text-center text-blue-900 mb-6">
                S/. 59.90/mes
              </p>
              <ul className="mb-6 space-y-2 text-gray-700">
                <li>• Hasta 100 imágenes procesadas al mes.</li>
                <li>• Funciones completas habilitadas.</li>
                <li>• Reportes básicos en formato PDF.</li>
              </ul>
              <div className="flex justify-center">
                <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transform transition-all duration-200 ease-in-out">
                  Seleccionar
                </button>
              </div>
            </div>

            {/* Plan Premium */}
            <div className="bg-white rounded-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-2xl p-6 ease-in-out duration-300">
              <h2 className="text-xl font-semibold text-center text-indigo-600 mb-4">
                Premium
              </h2>
              <p className="text-sm text-center text-gray-600 mb-6">
                Plan avanzado para negocios grandes o usuarios con alta demanda.
              </p>
              <p className="text-3xl font-semibold text-center text-blue-900 mb-6">
                S/. 199.99/mes
              </p>
              <ul className="mb-6 space-y-2 text-gray-700">
                <li>• Imágenes ilimitadas procesadas al mes.</li>
                <li>• Todas las funciones habilitadas.</li>
                <li>• Reportes avanzados en formato PDF y Excel.</li>
              </ul>
              <div className="flex justify-center">
                <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transform transition-all duration-200 ease-in-out">
                  Seleccionar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
