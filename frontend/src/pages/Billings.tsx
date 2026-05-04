import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  DollarSign,
  RotateCcw
} from 'lucide-react';

interface Billing {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  client: {
    name: string;
  };
}

const Billings: React.FC = () => {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBillings = async () => {
    try {
      const res = await api.get('/billings');
      setBillings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const handlePay = async (id: string) => {
    if (window.confirm('Deseja realmente marcar esta cobrança como PAGA?')) {
      try {
        await api.patch(`/billings/${id}/pay`);
        fetchBillings();
      } catch (err) {
        console.error(err);
        alert('Erro ao processar pagamento.');
      }
    }
  };

  const handleRevert = async (id: string) => {
    if (window.confirm('Deseja realmente ESTORNAR este pagamento para PENDENTE?')) {
      try {
        await api.patch(`/billings/${id}/revert`);
        fetchBillings();
      } catch (err) {
        console.error(err);
        alert('Erro ao estornar pagamento.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle2 size={14} /> <span>Pago</span></span>;
      case 'ATRASADO':
        return <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><AlertCircle size={14} /> <span>Atrasado</span></span>;
      case 'PENDENTE':
        return <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><Clock size={14} /> <span>Pendente</span></span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sistema de Cobranças</h2>
        <p className="text-gray-500">Acompanhe pagamentos e inadimplência.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {billings.map((billing) => (
                <tr key={billing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{billing.client.name}</span>
                      {billing.paidDate && (
                        <span className="text-[10px] text-gray-400">
                          Pago em: {new Date(billing.paidDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 italic">R$ {billing.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(billing.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{getStatusBadge(billing.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {billing.status !== 'PAGO' ? (
                        <button
                          onClick={() => handlePay(billing.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-bold flex items-center space-x-1 p-2 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <DollarSign size={16} />
                          <span>Marcar Pago</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevert(billing.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-bold flex items-center space-x-1 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Estornar Pagamento"
                        >
                          <RotateCcw size={16} />
                          <span>Estornar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {billings.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500 font-bold">Nenhuma cobrança encontrada.</div>
        )}
      </div>
    </div>
  );
};

export default Billings;
