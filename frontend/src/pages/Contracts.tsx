import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  User,
  X,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  Edit2
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface Contract {
  id: string;
  clientId: string;
  value: number;
  status: string;
  startDate: string;
  endDate: string;
  client: {
    name: string;
  };
  billing: Array<{
    id: string;
    amount: number;
    status: string;
    dueDate: string;
    paidDate?: string;
  }>;
}

const Contracts: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const today = new Date().toISOString().split('T')[0];
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    value: '' as string | number,
    installments: '1',
    startDate: today,
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
      // Atualizar o contrato selecionado se o modal de detalhes estiver aberto
      if (selectedContract) {
        const updated = response.data.find((c: Contract) => c.id === selectedContract.id);
        if (updated) setSelectedContract(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async (billingId: string, currentStatus: string) => {
    const isPaying = currentStatus !== 'PAGO';
    const action = isPaying ? 'marcar como PAGO' : 'ESTORNAR o pagamento para PENDENTE';
    
    if (window.confirm(`Deseja realmente ${action}?`)) {
      try {
        if (isPaying) {
          await api.patch(`/billings/${billingId}/pay`);
        } else {
          await api.patch(`/billings/${billingId}/revert`);
        }
        await fetchContracts();
      } catch (err: any) {
        console.error(err);
        const message = err.response?.data?.message || 'Erro ao processar alteração de pagamento.';
        alert(message);
      }
    }
  };

  const openDetailsModal = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDetailsModalOpen(true);
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      clientId: contract.clientId,
      value: contract.value,
      installments: '1', // Default or fetch if available
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate ? contract.endDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
      try {
        await api.delete(`/contracts/${id}`);
        fetchContracts();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir contrato.');
      }
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(formData.value);
    
    if (val > 50000000) {
      alert('O valor máximo permitido é de R$ 50.000.000,00 (50 milhões)');
      return;
    }
    if (val <= 0) {
      alert('O valor do contrato deve ser maior que 0');
      return;
    }
    try {
      if (editingContract) {
        await api.patch(`/contracts/${editingContract.id}`, {
          ...formData,
          value: val
        });
      } else {
        await api.post('/contracts', {
          ...formData,
          value: val,
          installments: Number(formData.installments)
        });
      }
      setIsModalOpen(false);
      setEditingContract(null);
      setFormData({ clientId: '', value: '', installments: '1', startDate: new Date().toISOString().split('T')[0], endDate: '' });
      fetchContracts();
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || 'Erro ao salvar contrato. Verifique os dados.';
      alert(message);
    }
  };

  const openNewContractModal = () => {
    setEditingContract(null);
    setFormData({ clientId: '', value: '', installments: '1', startDate: new Date().toISOString().split('T')[0], endDate: '' });
    setIsModalOpen(true);
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

  const getPaymentStatusBadge = (billings: any[]) => {
    if (!billings || billings.length === 0) return <span className="text-gray-400 text-xs italic">Sem cobrança</span>;
    
    const status = billings[0].status; // Pega a primeira cobrança vinculada
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Contratos</h2>
          <p className="text-gray-500">Contratos de crédito e status de aprovação.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={openNewContractModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-bold shadow-sm"
          >
            <Plus size={20} />
            <span>Novo Contrato</span>
          </button>
        )}
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
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Aprovação</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
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
                  <td className="px-6 py-4">{getPaymentStatusBadge(contract.billing)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openDetailsModal(contract)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Detalhes do Pagamento"
                      >
                        <Eye size={18} />
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => handleEdit(contract)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(contract.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {contracts.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500 font-bold">Nenhum contrato encontrado.</div>
        )}
      </div>

      {/* Modal Novo/Editar Contrato */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">{editingContract ? 'Editar Contrato' : 'Novo Contrato'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateContract} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
                <select
                  required
                  disabled={!!editingContract}
                  value={formData.clientId}
                  onChange={e => setFormData({...formData, clientId: e.target.value})}
                  className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 ${editingContract ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'}`}
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
                  max="50000000"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Parcelas</label>
                <select
                  required
                  value={formData.installments}
                  onChange={e => setFormData({...formData, installments: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24, 48].map(n => {
                    const monthlyValue = formData.value ? (Number(formData.value) / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
                    return (
                      <option key={n} value={n}>
                        {n}x {n > 1 ? `de ${monthlyValue}` : `(À vista - ${monthlyValue})`}
                      </option>
                    );
                  })}
                </select>
              </div>


              
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data Início</label>
                  <input
                    required
                    type="date"
                    min={!editingContract ? today : undefined}
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vencimento</label>
                  <input
                    type="date"
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md shadow-blue-200"
                >
                  {editingContract ? 'Salvar Alterações' : 'Criar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Pagamento */}
      {isDetailsModalOpen && selectedContract && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-screen flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detalhes do Pagamento</h3>
                <p className="text-sm text-gray-500">Contrato: {selectedContract.client.name} - R$ {selectedContract.value.toLocaleString()}</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-auto">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">Total Pago</p>
                  <p className="text-xl font-black text-blue-700">
                    R$ {selectedContract.billing.filter(b => b.status === 'PAGO').reduce((acc, b) => acc + b.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-600 font-bold uppercase mb-1">Parcelas Pagas</p>
                  <p className="text-xl font-black text-amber-700">
                    {selectedContract.billing.filter(b => b.status === 'PAGO').length} / {selectedContract.billing.length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <p className="text-xs text-green-600 font-bold uppercase mb-1">Status Global</p>
                  <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <Calendar size={18} className="text-blue-600" />
                <span>Cronograma de Parcelas</span>
              </h4>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600">Parcela</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Vencimento</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Valor</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Pagamento</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[...selectedContract.billing]
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map((b, idx) => (
                      <tr key={b.id} className={b.status === 'PAGO' ? 'bg-green-50/30' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-900">{idx + 1}ª Parcela</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(b.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">R$ {b.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {b.status === 'PAGO' ? (
                            <div className="text-xs">
                              <span className="text-green-600 font-bold block">PAGO</span>
                              <span className="text-gray-400">{b.paidDate ? new Date(b.paidDate).toLocaleString() : '-'}</span>
                            </div>
                          ) : (
                            <span className={`text-xs font-bold ${b.status === 'ATRASADO' ? 'text-red-600' : 'text-amber-600'}`}>
                              {b.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin && (
                            <button
                              onClick={() => handleTogglePayment(b.id, b.status)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                b.status === 'PAGO' 
                                  ? 'text-red-600 hover:bg-red-100' 
                                  : 'text-green-600 hover:bg-green-100'
                              }`}
                              title={b.status === 'PAGO' ? 'Estornar Pagamento' : 'Marcar como Pago'}
                            >
                              <DollarSign size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-bold shadow-sm"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
