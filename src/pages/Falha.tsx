import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function Falha() {
  const [searchParams] = useSearchParams();
  const [errorDetails, setErrorDetails] = useState<{
    payment_intent?: string;
    payment_intent_client_secret?: string;
    redirect_status?: string;
  }>({});

  useEffect(() => {
    const payment_intent = searchParams.get('payment_intent');
    const payment_intent_client_secret = searchParams.get('payment_intent_client_secret');
    const redirect_status = searchParams.get('redirect_status');

    setErrorDetails({
      payment_intent: payment_intent || undefined,
      payment_intent_client_secret: payment_intent_client_secret || undefined,
      redirect_status: redirect_status || undefined,
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Falha no Pagamento
          </h1>
          <p className="text-gray-600">
            Houve um problema ao processar seu pagamento. Tente novamente ou use outro método de pagamento.
          </p>
        </div>

        {errorDetails.payment_intent && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Detalhes do Erro</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                <span className="font-medium">ID da Tentativa:</span>
                <br />
                <code className="text-xs bg-white px-2 py-1 rounded">
                  {errorDetails.payment_intent}
                </code>
              </div>
              {errorDetails.redirect_status && (
                <div>
                  <span className="font-medium">Status:</span> {errorDetails.redirect_status}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            to="/checkout"
            className="block w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Tentar Novamente
          </Link>
          <Link
            to="/carrinho"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Voltar ao Carrinho
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Possíveis causas:</strong>
              <br />
              • Cartão recusado ou sem saldo
              <br />
              • Dados incorretos do cartão
              <br />
              • Problema temporário no processamento
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Precisa de ajuda? Entre em contato conosco pelo WhatsApp ou e-mail.
          </p>
        </div>
      </div>
    </div>
  );
}