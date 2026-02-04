import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FormTemplate, FormResponse, AnalysisRecord, FieldType, User, Institution, Department, UserRole } from '../types';

interface AppContextType {
  currentUser: User | null;
  institutions: Institution[];
  departments: Department[];
  forms: FormTemplate[]; // Dashboard view (filtered)
  allForms: FormTemplate[]; // Master list (unfiltered)
  responses: FormResponse[];
  analyses: AnalysisRecord[];
  
  login: (email: string, role?: UserRole, institutionId?: string, departmentId?: string) => void;
  logout: () => void;
  
  addInstitution: (inst: Institution) => void;
  updateInstitution: (id: string, updates: Partial<Institution>) => void;
  addDepartment: (dept: Department) => void;
  
  addForm: (form: FormTemplate) => void;
  addResponse: (response: FormResponse) => void;
  addAnalysis: (analysis: AnalysisRecord) => void;
  
  getForm: (id: string) => FormTemplate | undefined;
  getResponsesByForm: (formId: string) => FormResponse[];
  getAnalysisByForm: (formId: string) => AnalysisRecord | undefined;
  getCurrentInstitution: () => Institution | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- MOCK DATA ---
const MOCK_FORM: FormTemplate = {
  id: 'form-1',
  institutionId: 'inst-1',
  title: 'Guest Experience Survey',
  description: 'Tell us about your stay at Grand Azure.',
  industry: 'Hospitality',
  createdAt: new Date().toISOString(),
  fields: [
    { id: 'cleanliness', label: 'Room Cleanliness', type: FieldType.RATING, required: true },
    { id: 'staff', label: 'Staff Friendliness', type: FieldType.RATING, required: true },
    { id: 'checkin', label: 'Check-in Speed', type: FieldType.RATING, required: true },
    { id: 'comments', label: 'Comments', type: FieldType.TEXT, required: false }
  ]
};

const DEFAULT_INST: Institution = {
  id: 'inst-1',
  name: 'Grand Azure Hotels',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/201/201623.png',
  primaryColor: '#0f766e',
  secondaryColor: '#f0fdfa',
  createdAt: new Date().toISOString()
};

// --- HELPER FOR IMMEDIATE HYDRATION ---
const getSaved = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try {
    return JSON.parse(saved);
  } catch {
    return defaultValue;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use functional initialization to avoid "flash of missing data"
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSaved('if_user', null));
  const [institutions, setInstitutions] = useState<Institution[]>(() => getSaved('if_institutions', [DEFAULT_INST]));
  const [departments, setDepartments] = useState<Department[]>(() => getSaved('if_depts', []));
  const [rawForms, setRawForms] = useState<FormTemplate[]>(() => getSaved('if_forms', [MOCK_FORM]));
  const [responses, setResponses] = useState<FormResponse[]>(() => getSaved('if_responses', []));
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>(() => getSaved('if_analyses', []));

  // Handle Cross-Tab Syncing
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'if_responses' && e.newValue) setResponses(JSON.parse(e.newValue));
      if (e.key === 'if_forms' && e.newValue) setRawForms(JSON.parse(e.newValue));
      if (e.key === 'if_analyses' && e.newValue) setAnalyses(JSON.parse(e.newValue));
      if (e.key === 'if_user' && !e.newValue) setCurrentUser(null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync to LocalStorage whenever state changes
  useEffect(() => { localStorage.setItem('if_institutions', JSON.stringify(institutions)); }, [institutions]);
  useEffect(() => { localStorage.setItem('if_depts', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('if_forms', JSON.stringify(rawForms)); }, [rawForms]);
  useEffect(() => { localStorage.setItem('if_responses', JSON.stringify(responses)); }, [responses]);
  useEffect(() => { localStorage.setItem('if_analyses', JSON.stringify(analyses)); }, [analyses]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem('if_user', JSON.stringify(currentUser)); 
    else localStorage.removeItem('if_user');
  }, [currentUser]);

  const login = (email: string, role?: UserRole, institutionId?: string, departmentId?: string) => {
    const user: User = {
      id: email === 'super@insightflow.ai' ? 'u-admin' : `u-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: email === 'super@insightflow.ai' ? UserRole.SUPER_ADMIN : (role || UserRole.INSTITUTION_ADMIN),
      institutionId: institutionId || 'inst-1',
      departmentId
    };
    setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  const addInstitution = (inst: Institution) => setInstitutions(prev => [inst, ...prev]);
  const updateInstitution = (id: string, updates: Partial<Institution>) => {
    setInstitutions(prev => prev.map(inst => inst.id === id ? { ...inst, ...updates } : inst));
  };
  const addDepartment = (dept: Department) => setDepartments(prev => [...prev, dept]);

  const addForm = (form: FormTemplate) => {
    const newForm = { ...form };
    if (currentUser?.institutionId) newForm.institutionId = currentUser.institutionId;
    setRawForms(prev => [newForm, ...prev]);
  };

  const addResponse = (response: FormResponse) => {
    setResponses(prev => {
      const next = [response, ...prev];
      // Manual trigger for current tab persistence
      localStorage.setItem('if_responses', JSON.stringify(next));
      return next;
    });
  };

  const addAnalysis = (analysis: AnalysisRecord) => {
    setAnalyses(prev => [analysis, ...prev.filter(a => a.formId !== analysis.formId)]);
  };

  const getForm = (id: string) => rawForms.find(f => f.id === id);
  const getResponsesByForm = (formId: string) => responses.filter(r => r.formId === formId);
  const getAnalysisByForm = (formId: string) => analyses.find(a => a.formId === formId);
  
  const getCurrentInstitution = () => {
    if (!currentUser?.institutionId) return undefined;
    return institutions.find(i => i.id === currentUser.institutionId);
  };

  const visibleForms = rawForms.filter(f => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.SUPER_ADMIN) return true;
    if (f.institutionId !== currentUser.institutionId) return false;
    if (currentUser.role === UserRole.DEPT_ADMIN && f.departmentId && f.departmentId !== currentUser.departmentId) return false;
    return true;
  });

  return (
    <AppContext.Provider value={{ 
      currentUser, institutions, departments,
      forms: visibleForms, 
      allForms: rawForms,
      responses, analyses, 
      login, logout,
      addInstitution, updateInstitution, addDepartment,
      addForm, addResponse, addAnalysis, 
      getForm, getResponsesByForm, getAnalysisByForm, getCurrentInstitution
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};