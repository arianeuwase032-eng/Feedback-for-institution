import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { ShieldCheck, Building2, Users, ChevronRight, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const { login, institutions } = useAppStore();
  const navigate = useNavigate();
  
  const [loginMode, setLoginMode] = useState<'super' | 'institution'>('institution');
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.INSTITUTION_ADMIN);
  const [email, setEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMode === 'super') {
      login('super@insightflow.ai');
    } else {
      if (!selectedInstId) {
        alert("Please select an institution");
        return;
      }
      // Dynamic login for institution users
      // If they type an email, use it, otherwise generate one based on the institution
      const finalEmail = email || `admin@${selectedInstId}.com`;
      login(finalEmail, selectedRole, selectedInstId);
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50/50">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-indigo-900/10">
        
        {/* Left Side - Brand / Info */}
        <div className="md:w-5/12 bg-indigo-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
             <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-8 border border-white/10">
               <span className="font-bold text-2xl">I</span>
             </div>
             <h1 className="text-3xl font-extrabold mb-4 leading-tight">Institutional Intelligence Platform</h1>
             <p className="text-indigo-200 text-lg leading-relaxed">Turn feedback into actionable data for better decision making.</p>
          </div>
          
          <div className="relative z-10 text-sm text-indigo-300">
            &copy; 2024 InsightFlow AI
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-blue-500/30 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-7/12 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500">Please select your access level to continue.</p>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button 
              onClick={() => setLoginMode('institution')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${loginMode === 'institution' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Institution Access
            </button>
            <button 
              onClick={() => setLoginMode('super')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${loginMode === 'super' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Super Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {loginMode === 'super' ? (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                 <ShieldCheck className="text-indigo-600 shrink-0 mt-0.5" />
                 <div>
                   <h3 className="font-bold text-indigo-900">Platform Administrator</h3>
                   <p className="text-sm text-indigo-700 mt-1">You are logging in with master access to manage all institutions.</p>
                 </div>
              </div>
            ) : (
              <>
                {/* Institution Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Institution</label>
                  <div className="relative">
                    <select 
                      value={selectedInstId}
                      onChange={(e) => setSelectedInstId(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                      required
                    >
                      <option value="">-- Choose Organization --</option>
                      {institutions.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="rotate-90" size={16} />
                    </div>
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Access Role</label>
                   <div className="grid grid-cols-2 gap-3">
                      <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col gap-2 transition-all ${selectedRole === UserRole.INSTITUTION_ADMIN ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
                        <input type="radio" name="role" className="sr-only" checked={selectedRole === UserRole.INSTITUTION_ADMIN} onChange={() => setSelectedRole(UserRole.INSTITUTION_ADMIN)} />
                        <Building2 size={20} className={selectedRole === UserRole.INSTITUTION_ADMIN ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className={`text-sm font-bold ${selectedRole === UserRole.INSTITUTION_ADMIN ? 'text-indigo-900' : 'text-slate-600'}`}>Admin</span>
                      </label>
                      <label className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col gap-2 transition-all ${selectedRole === UserRole.DEPT_ADMIN ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
                        <input type="radio" name="role" className="sr-only" checked={selectedRole === UserRole.DEPT_ADMIN} onChange={() => setSelectedRole(UserRole.DEPT_ADMIN)} />
                        <Users size={20} className={selectedRole === UserRole.DEPT_ADMIN ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className={`text-sm font-bold ${selectedRole === UserRole.DEPT_ADMIN ? 'text-indigo-900' : 'text-slate-600'}`}>Department</span>
                      </label>
                   </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {loginMode === 'super' ? 'Access Platform' : 'Sign In to Dashboard'} <ChevronRight size={18} />
              </button>
            </div>

            {loginMode === 'super' && (
              <p className="text-xs text-center text-slate-400">
                Default: super@insightflow.ai
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;