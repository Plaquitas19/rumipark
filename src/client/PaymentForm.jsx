import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios"; // Necesario para hacer la solicitud HTTP

const PaymentForm = ({ selectedPlan, onClose, userId }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);

    // Crear un método de pago utilizando la tarjeta
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        name,
        email,
        address: {
          line1: address,
          postal_code: zip,
        },
      },
    });

    if (error) {
      setIsProcessing(false);
      console.error(error);
    } else {
      try {
        // Enviar los datos del pago a tu API para cambiar el plan y registrar la transacción
        const response = await axios.post("/cambiar_plan", {
          usuario_id: userId,
          plan_id: selectedPlan, // Asegúrate de enviar el plan seleccionado
          stripe_token: paymentMethod.id, // El token de Stripe que generaste
        });

        // Verifica si el cambio fue exitoso
        if (response.data.message === "Plan actualizado exitosamente") {
          console.log("Pago y actualización del plan exitosos.");
          onClose(); // Cerrar modal después del pago exitoso
        } else {
          console.error(
            "Hubo un error al cambiar el plan:",
            response.data.error
          );
        }
      } catch (err) {
        console.error("Error en la solicitud API:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-8 rounded-lg shadow-lg w-96 bg-white"
      style={{
        border: "2px solid #167f9f", // Color del borde exterior
        boxShadow: "0 0 10px 0 rgba(22, 127, 159, 0.6)", // Efecto de iluminado exterior
      }}
    >
      {/* Título dentro del modal */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          Registrando pago
        </h2>
        <p className="text-sm text-gray-500">
          Por favor, ingrese sus detalles para completar la compra.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-gray-700">
            Nombre del titular de la tarjeta
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-gray-700">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-gray-700">
            Dirección
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="zip" className="block text-gray-700">
            Código Postal
          </label>
          <input
            id="zip"
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="card-element" className="block text-gray-700">
            Tarjeta de Crédito
          </label>
          <CardElement id="card-element" className="border p-2 rounded-md" />
        </div>
      </div>

      <div className="flex justify-between mt-4">
        {/* Botón de Cancelar */}
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transform transition-all duration-200 ease-in-out"
        >
          Cancelar
        </button>

        {/* Botón de Pagar */}
        <button
          type="submit"
          disabled={isProcessing || !stripe}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transform transition-all duration-200 ease-in-out"
        >
          {isProcessing ? "Procesando..." : "Pagar"}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
