import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface BankAccount {
  id: number;
  name: string;
  balance: number;
}

interface Expense {
  id: number;
  name: string;
  amount: number;
  paid: boolean;
  day: number;
  months: string;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Sledování relace Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchData();
      } else {
        setBanks([]);
        setExpenses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError('Nespravný e-mail nebo heslo.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchData = async () => {
    setLoading(true);

    const { data: banksData, error: banksError } = await supabase
      .from('banks')
      .select('*')
      .order('id', { ascending: true });

    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('day', { ascending: true });

    if (banksError) console.error('Chyba při načítání účtů:', banksError);
    if (expensesError) console.error('Chyba při načítání plateb:', expensesError);

    if (banksData) setBanks(banksData);
    if (expensesData) setExpenses(expensesData);

    setLoading(false);
  };

  const togglePaid = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, paid: newStatus } : exp));

    const { error } = await supabase
      .from('expenses')
      .update({ paid: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Chyba při ukládání:', error);
      fetchData();
    }
  };

  const updateBankBalance = async (id: number, newBalance: number) => {
    setBanks(prev => prev.map(b => b.id === id ? { ...b, balance: newBalance } : b));

    const { error } = await supabase
      .from('banks')
      .update({ balance: newBalance })
      .eq('id', id);

    if (error) console.error('Chyba při úpravě zůstatku:', error);
  };

  // --- ZOBRAZENÍ PŘIHLÁŠENÍ (pokud uživatel není přihlášen) ---
  if (!session) {
    return (
      <div style={{ maxWidth: '350px', margin: '80px auto', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '12px', fontFamily: 'sans-serif', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111827' }}>Moje Peněženka</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#374151', fontWeight: 'bold' }}>E-mail</label>
            <input
              type="email"
              placeholder="vas@email.cz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#374151', fontWeight: 'bold' }}>Heslo</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>
          {authError && <p style={{ color: '#dc2626', fontSize: '13px', margin: '0' }}>{authError}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
          >
            {loading ? 'Přihlašování...' : 'Přihlásit se'}
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>Načítám data z cloudu...</div>;
  }

  // --- LOGIKA FINANČNÍHO CYKLUS (10. - 9.) ---
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let cycleEndDate: Date;
  let mainCycleMonth: number;

  if (currentDay >= 10) {
    cycleEndDate = new Date(currentYear, today.getMonth() + 1, 9);
    mainCycleMonth = currentMonth;
  } else {
    cycleEndDate = new Date(currentYear, today.getMonth(), 9);
    mainCycleMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  }

  const diffTime = cycleEndDate.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const currentExpenses = expenses.filter(exp => {
    if (!exp.months || exp.months === 'všechny') return true;
    const allowedMonths = exp.months.split(',').map(m => parseInt(m.trim(), 10));
    return allowedMonths.includes(mainCycleMonth);
  });

  const isPastInCycle = (expDay: number): boolean => {
    if (currentDay >= 10) {
      if (expDay >= 10) return expDay <= currentDay;
      return false;
    } else {
      if (expDay >= 10) return true;
      return expDay <= currentDay;
    }
  };

  const processedExpenses = currentExpenses.map(exp => ({
    ...exp,
    isPaidEffective: exp.paid || isPastInCycle(exp.day)
  }));

  const sortedExpenses = [...processedExpenses].sort((a, b) => {
    const orderA = a.day >= 10 ? a.day : a.day + 100;
    const orderB = b.day >= 10 ? b.day : b.day + 100;
    return orderA - orderB;
  });

  const totalInBanks = banks.reduce((acc, b) => acc + Number(b.balance || 0), 0);
  const remainingToPay = sortedExpenses
    .filter(e => !e.isPaidEffective)
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const freeMoney = totalInBanks - remainingToPay;
  const freeMoneyPerDay = Math.round(freeMoney / daysLeft);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>Finanční Přehled</h2>
        <button 
          onClick={handleLogout}
          style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          Odhlásit
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: '#e0f2fe', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <small>Celkem na účtech:</small>
          <h3>{totalInBanks.toLocaleString()} Kč</h3>
        </div>
        <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <small>Zbývá doplatit:</small>
          <h3>{remainingToPay.toLocaleString()} Kč</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: '#dcfce7', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <small>Volné peníze celkem:</small>
          <h2>{freeMoney.toLocaleString()} Kč</h2>
        </div>
        <div style={{ background: '#bbf7d0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <small>Na den ({daysLeft} dnů do 9.):</small>
          <h2>{freeMoneyPerDay.toLocaleString()} Kč/den</h2>
        </div>
      </div>

      <h3>Stav na účtech</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {banks.map(bank => (
          <div key={bank.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666' }}>{bank.name}</label>
            <input
              type="number"
              value={bank.balance}
              onChange={(e) => updateBankBalance(bank.id, Number(e.target.value))}
              style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      <h3>Platby v tomto cyklu</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedExpenses.map(exp => (
          <div 
            key={exp.id} 
            onClick={() => togglePaid(exp.id, exp.isPaidEffective)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              cursor: 'pointer',
              background: exp.isPaidEffective ? '#f3f4f6' : '#fff',
              opacity: exp.isPaidEffective ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={exp.isPaidEffective} readOnly />
              <span style={{ textDecoration: exp.isPaidEffective ? 'line-through' : 'none' }}>
                {exp.day}. v měsíci - <strong>{exp.name}</strong>
              </span>
            </div>
            <strong>{exp.amount.toLocaleString()} Kč</strong>
          </div>
        ))}
      </div>
    </div>
  );
}