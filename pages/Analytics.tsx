import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { analyzeFeedbackWithAI } from '../services/gemini';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Sparkles, ArrowLeft, BrainCircuit, TrendingUp, AlertTriangle, CheckCircle2, QrCode, X, Copy, Share2, BarChart2
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { getForm, getResponsesByForm, getAnalysisByForm, addAnalysis, forms } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const currentFormId = formId || (forms.length > 0 ? forms[0].id : undefined);
  const form = currentFormId ? getForm(currentFormId) : undefined;
  const responses = currentFormId ? getResponsesByForm(currentFormId) : [];
  const existingAnalysis = currentFormId ? getAnalysisByForm(currentFormId) : undefined;

  useEffect(() => {
    if (!formId && forms.length > 0) {
      navigate(`/analytics/${forms[0].id}`, { replace: true });
    }
  }, [formId, forms, navigate]);

  if (!form) return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <BarChart2 className="text-slate-300" size={40} />
      </div>
      <p className="text-slate-500 mb-6 text-lg">No forms available to analyze.</p>
      <Link to="/create" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">Create a New Form</Link>
    </div>
  );

  const handleRunAnalysis = async () => {
    if (responses.length === 0) {
      alert("Please wait for at least one response before running AI analysis.");
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeFeedbackWithAI(form, responses.map(r => r.answers));
      addAnalysis({
        formId: form.id,
        result,
        generatedAt: new Date().toISOString()
      });
    } catch (e: any) {
      console.error(e);
      alert(e.message || "AI Analysis failed. Ensure your API key is correct.");
    } finally {
      setLoading(false);
    }
  };

  const ratingFields = form.fields.filter(f => f.type === 'rating');
  const chartData = ratingFields.map(field => {
    const scores = responses.map(r => Number(r.answers[field.id] || 0)).filter(s => s > 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { 
      name: field.label.length > 25 ? field.label.substring(0, 22) + '...' : field.label, 
      fullLabel: field.label, 
      value: parseFloat(avg.toFixed(1)) 
    };
  });

  // Accurate link generation for HashRouter
  const getShareUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    // Handle cases where pathname might already have a trailing slash
    const cleanPath = pathname.endsWith('/') ? pathname : pathname + '/';
    return `${origin}${pathname}#/submit/${form.id}`;
  };

  const shareLink = getShareUrl();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareLink)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Public feedback link copied to clipboard!");
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">{form.title}</h1>
          </div>
          <div className="flex items-center gap-4 pl-2">
             <span className="text-xs font-black px-3 py-1 rounded-full text-indigo-600 bg-indigo-50 border border-indigo-100 uppercase tracking-widest">{form.industry}</span>
             <span className="text-slate-400 text-sm font-medium">Created {new Date(form.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={() => setShowQR(true)}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
          >
            <Share2 size={20} className="text-indigo-500" /> Share Link
          </button>
          <button 
            onClick={handleRunAnalysis}
            disabled={loading || responses.length === 0}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 hover:shadow-xl shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
          >
            {loading ? <BrainCircuit className="animate-spin" /> : <Sparkles size={20} />}
            {existingAnalysis ? 'Refresh Insights' : 'Generate AI Insights'}
          </button>
        </div>
      </div>

       {/* QR Code Modal */}
       {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 relative overflow-hidden">
             <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
             
             <div className="text-center">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg shadow-indigo-50">
                  <QrCode size={40} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Public Link</h3>
                <p className="text-slate-500 mb-8 font-medium">Copy this link or scan the code to collect feedback.</p>
                
                <div className="bg-white p-6 rounded-3xl border-4 border-slate-50 inline-block mb-8 shadow-inner">
                   <img src={qrUrl} alt="Form QR Code" className="w-56 h-56" />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 mb-2">
                   <p className="text-sm text-slate-500 truncate flex-1 font-mono font-medium">{shareLink}</p>
                   <button onClick={copyToClipboard} className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-xl transition-all">
                     <Copy size={20} />
                   </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 italic">Note: Link works best when hosted on a live server.</p>
             </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 z-10">Total Responses</p>
          <div className="flex items-baseline gap-2 z-10">
            <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{responses.length}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <BarChart2 size={120} />
          </div>
        </div>
        
        {existingAnalysis && (
          <>
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center group">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">AI Sentiment</p>
                <div className="flex items-center gap-3">
                  <div className={`text-5xl font-black tracking-tighter ${
                    existingAnalysis.result.sentimentScore > 75 ? 'text-emerald-500' : 
                    existingAnalysis.result.sentimentScore > 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {existingAnalysis.result.sentimentScore}%
                  </div>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                   <div 
                    className={`h-full transition-all duration-1000 ${
                      existingAnalysis.result.sentimentScore > 75 ? 'bg-emerald-500' : 
                      existingAnalysis.result.sentimentScore > 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${existingAnalysis.result.sentimentScore}%` }}
                   />
                </div>
            </div>
            <div className="md:col-span-2 bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
               <div className="relative z-10">
                 <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Sparkles size={16} /> AI Summary
                 </p>
                 <p className="text-slate-200 text-base leading-relaxed font-medium line-clamp-4 group-hover:line-clamp-none transition-all">{existingAnalysis.result.summary}</p>
               </div>
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
            </div>
          </>
        )}
      </div>

      {/* Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[450px]">
          <h3 className="font-black text-slate-800 mb-8 text-xl tracking-tight">Core Performance Metrics</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={140} 
                  tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}} 
                  axisLine={false}
                  tickLine={false}
                />
                <RechartTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '15px'}}
                />
                <Bar 
                  dataKey="value" 
                  fill="#6366f1" 
                  radius={[0, 10, 10, 0]} 
                  barSize={32}
                  background={{ fill: '#f8fafc', radius: [0, 10, 10, 0] }}
                >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                <BarChart2 size={48} strokeWidth={1} />
                <p className="font-bold">No rating metrics to display</p>
             </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[450px] flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="font-black text-slate-800 flex items-center gap-3 text-xl tracking-tight">
              <BrainCircuit className="text-indigo-600" size={24} />
              Strategic Advice
            </h3>
            {existingAnalysis && <span className="text-[10px] bg-white border border-slate-100 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-widest shadow-sm">Updated {new Date(existingAnalysis.generatedAt).toLocaleTimeString()}</span>}
          </div>

          <div className="p-6 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar">
            {!existingAnalysis ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-[30px] flex items-center justify-center mb-6 shadow-sm">
                     <Sparkles size={40} />
                  </div>
                  <h4 className="text-slate-900 font-black text-xl mb-2">Analyze Responses</h4>
                  <p className="text-slate-500 font-medium">Click the generate button above to get tailored institutional recommendations.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {existingAnalysis.result.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-3xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                    <div className="shrink-0">
                      {rec.priority === 'High' ? <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><AlertTriangle size={20} /></div> : 
                       rec.priority === 'Medium' ? <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><TrendingUp size={20} /></div> :
                       <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><CheckCircle2 size={20} /></div>}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{rec.title}</h4>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md border ${
                           rec.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                           rec.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>{rec.priority}</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;