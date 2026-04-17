import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  User,
  X
} from 'lucide-react';

interface Contract {
  id: string;
  value: number;
  status: string;
  startDate: string;
  endDate: string;
  client: {
    name: string;
  };
}

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    value: '' as string | number,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  useEffect(() => {
    fetchContracts();
    fetchClients();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await api.get('/contracts');
      setContracts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(formData.value);
    
    if (val > 50000000) {
      alert('O valor máximo permitido é de R$ 50.000.000,00 (50 milhões)');
      return;
    }

    try {
      await api.post('/contracts', {
        ...formData,
        value: val
      });
      setIsModalOpen(false);
      setFormData({ clientId: '', value: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
      fetchContracts();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar contrato. Verifique o score do cliente.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle2 size={14} /> <span>Aprovado</span></span>;
      case 'REPROVADO':
        return <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={14} /> <span>Reprovado</span></span>;
      case 'PENDENTE':
        return <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><Clock size={14} /> <span>Pendente</span></span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Contratos</h2>
          <p className="text-gray-500">Contratos de crédito e status de aprovação.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-bold shadow-sm"
        >
          <Plus size={20} />
          <span>Novo Contrato</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Início</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <User size={18} />
                      </div>
                      <span className="font-semibold text-gray-900">{contract.client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 italic">R$ {contract.value.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(contract.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4">{getStatusBadge(contract.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {contracts.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500 font-bold">Nenhum contrato encontrado.</div>
        )}
      </div>

      {/* Modal Novo Contrato */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Novo Contrato</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateContract} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
                <select
                  required
                  value={formData.clientId}
                  onChange={e => setFormData({...formData, clientId: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Valor do Contrato (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  max="50000000"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data Início</label>
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data Fim (Opcional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-100"
                >
                  Gerar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
