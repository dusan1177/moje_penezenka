import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

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
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Načtení dat ze Supabase při spuštění
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Načíst účty
    const { data: banksData, error: banksError } = await supabase
      .from('banks')
      .select('*')
      .order('id', { ascending: true });

    // Načíst platby
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

  // Přepnutí stavu zaplaceno / nezaplaceno
  const togglePaid = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Lokální aktualizace pro rychlou odezvu
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, paid: newStatus } : exp));

    // Uložení do Supabase
    const { error } = await supabase
      .from('expenses')
      .update({ paid: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Chyba při ukládání:', error);
      fetchData(); // Vracíme stav zpět při ошибce
    }
  };

  // Změna zůstatku na účtu
  const updateBankBalance = async (id: number, newBalance: number) => {
    setBanks(prev => prev.map(b => b.id === id ? { ...b, balance: newBalance } : b));

    const { error } = await supabase
      .from('banks')
      .update({ balance: newBalance })
      .eq('id', id);

    if (error) console.error('Chyba při úpravě zůstatku:', error);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Načítám data z cloudu...</div>;
  }

  const totalInBanks = banks.reduce((acc, b) => acc + Number(b.balance || 0), 0);
  const remainingToPay = expenses.filter(e => !e.paid).reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const freeMoney = totalInBanks - remainingToPay;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Finanční Přehled</h2>

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

      <div style={{ background: '#dcfce7', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
        <small>Volné peníze:</small>
        <h2>{freeMoney.toLocaleString()} Kč</h2>
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
        {expenses.map(exp => (
          <div 
            key={exp.id} 
            onClick={() => togglePaid(exp.id, exp.paid)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              cursor: 'pointer',
              background: exp.paid ? '#f3f4f6' : '#fff',
              opacity: exp.paid ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={exp.paid} readOnly />
              <span style={{ textDecoration: exp.paid ? 'line-through' : 'none' }}>
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