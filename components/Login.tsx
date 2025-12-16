import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemCheck, setSystemCheck] = useState<{status: 'ok' | 'error', msg: string} | null>(null);

  useEffect(() => {
    // Check if the API Key was successfully injected during the Vite build
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey.length < 10) {
      setSystemCheck({
        status: 'error',
        msg: 'CRITICAL: API_KEY missing in build. Go to Netlify > Site Config > Environment Variables, add API_KEY, and Trigger a new Deploy.'
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (systemCheck?.status === 'error') {
      setError("Cannot login: System configuration missing.");
      return;
    }

    setLoading(true);
    setError('');

    // Simulate a brief network check for effect
    setTimeout(() => {
        if (password === 'Nikto forever') {
            onLogin();
        } else {
            setError('Access Denied: Invalid Security Clearance');
            setPassword('');
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-red-900/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-[#1e293b] p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-gray-700 mb-4 shadow-lg shadow-red-900/20">
                <i className="fas fa-shield-alt text-nikto-primary text-2xl"></i>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">NIKTO <span className="text-nikto-primary">IT</span></h1>
            <p className="text-gray-400 text-xs font-bold tracking-[0.2em] uppercase">Central Command Login</p>
        </div>

        {systemCheck?.status === 'error' && (
           <div className="mb-6 bg-red-900/50 border border-red-500 p-4 rounded-lg text-xs text-red-200 font-mono">
              <i className="fas fa-bug mr-2 text-lg float-left"></i>
              {systemCheck.msg}
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2 ml-1">Access Key</label>
                <div className="relative">
                    <i className="fas fa-key absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-nikto-primary focus:border-transparent outline-none transition-all placeholder-gray-600"
                        placeholder="Enter password..."
                        autoFocus
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2 animate-pulse">
                    <i className="fas fa-exclamation-triangle"></i>
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading || systemCheck?.status === 'error'}
                className="w-full bg-gradient-to-r from-nikto-primary to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span><i className="fas fa-circle-notch fa-spin mr-2"></i> Verifying...</span>
                ) : (
                    <span><i className="fas fa-fingerprint mr-2"></i> Authenticate</span>
                )}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-500">
                Restricted System. Unauthorized access is monitored and logged.
                <br/>Session ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;