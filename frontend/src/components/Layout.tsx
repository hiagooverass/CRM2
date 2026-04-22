import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  LogOut,
  Search,
  Menu,
  X,
  User as UserIcon,
  Settings,
  Shield,
  Save
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const response = await api.patch('/auth/profile', {
        name: profileFormData.name,
        email: profileFormData.email,
        ...(profileFormData.password ? { password: profileFormData.password } : {})
      });
      
      updateUser(response.data.user);
      setProfileSuccess(true);
      setProfileFormData(prev => ({ ...prev, password: '' }));
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Clientes', icon: Users, path: '/clients' },
    { label: 'Contratos', icon: FileText, path: '/contracts' },
    { label: 'Cobranças', icon: CreditCard, path: '/billings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">CRM Crédito</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => {
              setProfileFormData({ name: user?.name || '', email: user?.email || '', password: '' });
              setIsProfileModalOpen(true);
            }}
            className="w-full flex items-center space-x-3 mb-4 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Settings size={16} className="text-gray-400" />
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden text-gray-600"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="relative hidden md:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </span>
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="p-6 flex items-center justify-between">
              <h1 className="text-xl font-bold text-blue-600">CRM Crédito</h1>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center space-x-3 w-full p-3 mb-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {user?.name?.[0]}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Meu Perfil</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full p-3 text-red-600 font-medium"
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserIcon size={24} />
                  Editar Perfil
                </h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                  {user?.name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-lg">{user?.name}</p>
                  <p className="text-blue-100 text-sm flex items-center gap-1">
                    <Shield size={14} /> {user?.role}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              {profileError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-100">
                  Perfil atualizado com sucesso!
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={profileFormData.name}
                  onChange={e => setProfileFormData({...profileFormData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900"
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={profileFormData.email}
                  onChange={e => setProfileFormData({...profileFormData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nova Senha (opcional)</label>
                <input
                  type="password"
                  value={profileFormData.password}
                  onChange={e => setProfileFormData({...profileFormData, password: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900"
                  placeholder="Deixe em branco para manter a atual"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {profileLoading ? 'Salvando...' : (
                    <>
                      <Save size={18} />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
