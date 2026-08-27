import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Loader2 } from "lucide-react";

interface PayPalCheckoutProps {
  amount: number;
  projectId: string;
  planType: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  amount,
  projectId,
  planType,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl max-w-md mx-auto">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">PayPal Checkout</h3>
          <p className="text-xs text-zinc-500">Upgrade or publish your spot</p>
        </div>
        <p className="text-2xl font-extrabold text-white">${amount.toFixed(2)}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-primary-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Processing payment...</span>
        </div>
      )}

      <div className={`${loading ? "hidden" : "block"}`}>
        <PayPalScriptProvider options={{ clientId, currency: "USD" }}>
          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "USD",
                      value: amount.toFixed(2),
                    },
                    custom_id: projectId,
                  },
                ],
              });
            }}
            onApprove={async (data, actions) => {
              setLoading(true);
              if (actions.order) {
                const details = await actions.order.capture();
                try {
                  const res = await fetch("/api/payments/capture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      projectId,
                      orderId: details.id,
                      amount,
                      planType,
                    }),
                  });
                  const resData = await res.json();
                  if (resData.success) {
                    onSuccess();
                  } else {
                    alert("Verification failed. Contact support.");
                  }
                } catch (err) {
                  alert("Error verifying payment.");
                } finally {
                  setLoading(false);
                }
              }
            }}
            onCancel={onCancel}
            onError={(err) => {
              alert("An error occurred with PayPal checkout.");
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
};
