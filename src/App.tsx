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
      setAuthError('Nesprávný e-mail nebo heslo.');
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

  // --- ZOBRAZENÍ PŘIHLÁŠENÍ ---
  if (!session) {
    return (
      <div className="wrap" style={{ maxWidth: '400px', paddingTop: '100px' }}>
        <header style={{ justifyContent: 'center', borderBottom: 'none', marginBottom: '24px' }}>
          <h1>Finanční přehled</h1>
        </header>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-card)', padding: '28px', borderRadius: '6px', border: '1px solid var(--line)' }}>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--text)', padding: '10px 12px', borderRadius: '4px', fontSize: '15px' }}
            />
          </div>
          <div>
            <label className="label">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--text)', padding: '10px 12px', borderRadius: '4px', fontSize: '15px' }}
            />
          </div>
          {authError && <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{authError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="logout"
            style={{ width: '100%', marginTop: '8px', padding: '12px', fontSize: '15px', background: 'var(--amber)', color: '#1c1e26', fontWeight: 600, border: 'none' }}
          >
            {loading ? 'Načítám...' : 'Přihlásit se'}
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wrap" style={{ textAlign: 'center', paddingTop: '120px' }}>
        <p className="label">Načítám finanční data...</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header>
        <h1>Finanční přehled</h1>
        <button onClick={handleLogout} className="logout">Odhlásit</button>
      </header>

      <div className="hero">
        <div className="hero-main">
          <p className="label">Volné peníze celkem</p>
          <p className="big-number">
            {freeMoney.toLocaleString('cs-CZ')}<sup>Kč</sup>
          </p>
          <p className="sub-note">
            {freeMoneyPerDay.toLocaleString('cs-CZ')} Kč/den · zbývá {daysLeft} {daysLeft === 1 ? 'den' : (daysLeft >= 2 && daysLeft <= 4 ? 'dny' : 'dnů')} do 9.
          </p>
        </div>
        <div className="hero-side">
          <div>
            <p className="label">Celkem na účtech</p>
            <p className="mid-number">{totalInBanks.toLocaleString('cs-CZ')} Kč</p>
          </div>
          <div>
            <p className="label">Zbývá doplatit</p>
            <p className="mid-number amber">{remainingToPay.toLocaleString('cs-CZ')} Kč</p>
          </div>
        </div>
      </div>

      <section>
        <h2>Stav na účtech</h2>
        <div className="accounts">
          {banks.map(bank => (
            <div key={bank.id} className="account">
              <div className="account-name">{bank.name}</div>
              <div className="account-input-row">
                <input
                  type="number"
                  value={bank.balance}
                  onChange={(e) => updateBankBalance(bank.id, Number(e.target.value))}
                />
                <span className="account-currency">Kč</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>
          Platby v tomto cyklu <span className="count">{sortedExpenses.length} položek</span>
        </h2>
        <div className="payments">
          {sortedExpenses.map(exp => (
            <div
              key={exp.id}
              className={`payment ${exp.isPaidEffective ? 'done' : ''}`}
              onClick={() => togglePaid(exp.id, exp.isPaidEffective)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`check ${exp.isPaidEffective ? 'checked' : ''}`}></div>
              <div className="payment-date">{exp.day}.</div>
              <div className="payment-name">{exp.name}</div>
              <div className="payment-amount">{exp.amount.toLocaleString('cs-CZ')} Kč</div>
            </div>
          ))}
        </div>
      </section>

      <footer>Ruční přehled rodinných financí</footer>
    </div>
  );
}