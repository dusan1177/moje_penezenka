import { useState, useEffect } from 'react';

interface Payment {
  id: number;
  name: string;
  day: number;
  amount: number;
  paid: boolean;
  isManualOverride?: boolean;
  months?: number[]; // Měsíce, kdy se platba hradí (např. [2, 5, 8, 11] pro čtvrtletní)
}

interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

const INITIAL_BANKS: BankAccount[] = [
  { id: 'csob', name: 'ČSOB', balance: 5882 },
  { id: 'rb', name: 'Raiffeisenbank', balance: 0 },
  { id: 'airbank', name: 'AirBank', balance: 1526 },
  { id: 'revolut', name: 'Revolut', balance: 0 },
  { id: 'kb', name: 'Komerční banka', balance: 0 },
  { id: 'moneta', name: 'Moneta', balance: 0 },
  { id: 'cash', name: 'Hotovost', balance: 1000 },
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: 1, name: 'Vojta obědy', day: 11, amount: 700, paid: false },
  { id: 2, name: 'Vojta kapesné', day: 11, amount: 1000, paid: false },
  { id: 3, name: 'Ondra kapesné', day: 11, amount: 1000, paid: false },
  { id: 4, name: 'Ondra obědy', day: 11, amount: 700, paid: false },
  { id: 5, name: 'Netflix', day: 7, amount: 528, paid: false },
  { id: 6, name: 'Disney+', day: 15, amount: 199, paid: false },
  { id: 7, name: 'Apple Music', day: 15, amount: 259, paid: false },
  { id: 8, name: 'Amundi DIP', day: 15, amount: 2000, paid: false },
  { id: 9, name: 'Moneta půjčka', day: 15, amount: 5564, paid: false },
  { id: 10, name: 'Elektřina', day: 25, amount: 2300, paid: false },
  { id: 11, name: 'TV / Internet', day: 17, amount: 135, paid: false },
  { id: 12, name: 'Ondra spoření', day: 17, amount: 500, paid: false },
  { id: 13, name: 'Rozhlas', day: 17, amount: 45, paid: false },
  { id: 14, name: 'Plyn', day: 24, amount: 200, paid: false },
  { id: 15, name: 'Penzijní spoření', day: 17, amount: 1700, paid: false },
  { id: 16, name: 'Vojta spoření', day: 17, amount: 500, paid: false },
  { id: 17, name: 'SkyShowtime', day: 19, amount: 89, paid: false },
  { id: 18, name: 'HBO MAX', day: 19, amount: 132, paid: false },
  { id: 19, name: 'Hypotéka', day: 20, amount: 12674, paid: false },
  { id: 20, name: 'Pojistka byt', day: 20, amount: 1173, paid: false, months: [2, 5, 8, 11] },
  { id: 26, name: 'Pojistka Citroën', day: 20, amount: 3660, paid: false, months: [2, 5, 8, 11] },
  { id: 21, name: 'Investice', day: 24, amount: 1500, paid: false },
  { id: 22, name: 'Táta a máma', day: 22, amount: 400, paid: false },
  { id: 23, name: 'Životní pojistka', day: 24, amount: 3100, paid: false },
  { id: 24, name: 'Nájem', day: 24, amount: 6786, paid: false },
  { id: 25, name: 'Splátka Equa', day: 23, amount: 6627, paid: false },
];

export default function App() {
  const [banks, setBanks] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('penezenka_banks');
    return saved !== null ? JSON.parse(saved) : INITIAL_BANKS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('penezenka_payments_v3');
    return saved !== null ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  // Stav pro formulář přidání nové platby
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDay, setNewDay] = useState('15');
  const [newFrequency, setNewFrequency] = useState<'monthly' | 'quarterly'>('monthly');

  // Ukládání do paměti
  useEffect(() => {
    localStorage.setItem('penezenka_banks', JSON.stringify(banks));
  }, [banks]);

  useEffect(() => {
    localStorage.setItem('penezenka_payments_v3', JSON.stringify(payments));
  }, [payments]);

  // Pomocná funkce pro vyhodnocení aktivních plateb v cyklu
  const isPaymentActiveInCurrentCycle = (payment: Payment): boolean => {
    if (!payment.months || payment.months.length === 0) return true;

    const today = new Date();
    const currentDay = today.getDate();
    let currentMonth = today.getMonth() + 1; // 1 - 12

    if (payment.day < 10 && currentDay >= 10) {
      currentMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    }

    return payment.months.includes(currentMonth);
  };

  // Vyhodnocení zaplacení podle cyklu 10. -> 9.
  const isPaymentPaidInCycle = (paymentDay: number, currentDay: number): boolean => {
    if (currentDay >= 10) {
      return paymentDay >= 10 && paymentDay <= currentDay;
    } else {
      return paymentDay >= 10 || paymentDay <= currentDay;
    }
  };

  // Automatické vyhodnocení stavu plateb
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDate();

    setPayments(prevPayments =>
      prevPayments.map(p => {
        if (p.isManualOverride) return p;
        return { ...p, paid: isPaymentPaidInCycle(p.day, currentDay) };
      })
    );
  }, []);

  const updateBankBalance = (id: string, amount: number) => {
    setBanks(banks.map(b => b.id === id ? { ...b, balance: amount } : b));
  };

  const togglePaid = (id: number) => {
    setPayments(payments.map(p => 
      p.id === id ? { ...p, paid: !p.paid, isManualOverride: true } : p
    ));
  };

  const resetForNewPaydayCycle = () => {
    const today = new Date();
    const currentDay = today.getDate();

    setPayments(payments.map(p => ({
      ...p,
      paid: isPaymentPaidInCycle(p.day, currentDay),
      isManualOverride: false
    })));
  };

  // Přidání nové platby přes formulář
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAmount || !newDay) return;

    const dayNum = Number(newDay);
    const amountNum = Number(newAmount);
    const today = new Date();
    const currentDay = today.getDate();

    const newPayment: Payment = {
      id: Date.now(),
      name: newName,
      day: dayNum,
      amount: amountNum,
      paid: isPaymentPaidInCycle(dayNum, currentDay),
      months: newFrequency === 'quarterly' ? [2, 5, 8, 11] : undefined
    };

    setPayments([...payments, newPayment]);

    // Reset formuláře
    setNewName('');
    setNewAmount('');
    setNewDay('15');
    setNewFrequency('monthly');
    setShowForm(false);
  };

  // Smazání platby
  const handleDeletePayment = (id: number) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  // Výpočet dní do výplaty (k 10. dni)
  const calculateDaysToPayday = (): number => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let payday = new Date(currentYear, currentMonth, 10);
    if (currentDay >= 10) {
      payday = new Date(currentYear, currentMonth + 1, 10);
    }

    const diffTime = payday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const daysToPayday = calculateDaysToPayday();

  // Filtr aktivních plateb pro tento cyklus
  const activePayments = payments.filter(isPaymentActiveInCurrentCycle);

  // Řazení aktivních plateb podle cyklu (od 10. dne do 9. dne)
  const sortedPayments = [...activePayments].sort((a, b) => {
    const orderA = a.day >= 10 ? a.day : a.day + 31;
    const orderB = b.day >= 10 ? b.day : b.day + 31;
    return orderA - orderB;
  });

  // Finanční výpočty
  const totalBankBalance = banks.reduce((sum, b) => sum + b.balance, 0);
  const totalToPay = activePayments.filter(p => !p.paid).reduce((sum, p) => sum + p.amount, 0);
  const moneyLeftInWallet = totalBankBalance - totalToPay;
  const dailyBudget = moneyLeftInWallet / daysToPayday;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '15px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#333' }}>
      
      {/* Hlavička */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px' }}>💸 Finanční Přehled</h1>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Období: 10. v měsíci ➔ 9. v dalším měsíci</span>
        </div>
        <button 
          onClick={resetForNewPaydayCycle}
          style={{ padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
        >
          🔄 Obnovit cyklus (Výplata 10.)
        </button>
      </div>

      {/* HLAVNÍ FINANČNÍ UKAZATELE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        
        <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: '#0d47a1', fontWeight: 'bold' }}>Celkem na účtech:</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0d47a1', marginTop: '3px' }}>
            {totalBankBalance.toLocaleString('cs-CZ')} Kč
          </div>
        </div>

        <div style={{ background: '#fff3cd', padding: '12px', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: '#856404', fontWeight: 'bold' }}>Zbývá doplatit v cyklu:</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#856404', marginTop: '3px' }}>
            {totalToPay.toLocaleString('cs-CZ')} Kč
          </div>
        </div>

        <div style={{ background: moneyLeftInWallet >= 0 ? '#d4edda' : '#f8d7da', padding: '12px', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: moneyLeftInWallet >= 0 ? '#155724' : '#721c24', fontWeight: 'bold' }}>Volné peníze do výplaty:</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: moneyLeftInWallet >= 0 ? '#155724' : '#721c24', marginTop: '3px' }}>
            {moneyLeftInWallet.toLocaleString('cs-CZ')} Kč
          </div>
        </div>

        <div style={{ background: '#f3e5f5', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #8e24aa' }}>
          <span style={{ fontSize: '11px', color: '#4a148c', fontWeight: 'bold' }}>Denní limit ({daysToPayday} dní do 10.):</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4a148c', marginTop: '3px' }}>
            {Math.round(dailyBudget).toLocaleString('cs-CZ')} Kč / den
          </div>
        </div>

      </div>

      {/* BANKY & HOTOVOST */}
      <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px', color: '#4b5563' }}>🏦 Stav v bankách a hotovost</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
          {banks.map(b => (
            <div key={b.id}>
              <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '2px' }}>{b.name}:</label>
              <input 
                type="number" 
                value={b.balance === 0 ? '' : b.balance}
                placeholder="0"
                onChange={(e) => updateBankBalance(b.id, Number(e.target.value))}
                style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #d1d5db', fontWeight: '600', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* TABULKA PLATEB + TLAČÍTKO PRO PŘIDÁNÍ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '15px' }}>📋 Platby v tomto cyklu ({activePayments.length})</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '6px 12px', background: showForm ? '#6b7280' : '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
        >
          {showForm ? '❌ Zavřít formulář' : '➕ Přidat novou platbu'}
        </button>
      </div>

      {/* FORMULÁŘ PRO PŘIDÁNÍ NOVÉ PLATBY */}
      {showForm && (
        <form onSubmit={handleAddPayment} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#166534' }}>Přidat novou platbu</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#374151', display: 'block' }}>Název položky:</label>
              <input 
                type="text" 
                placeholder="např. Spotify" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                required 
                style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#374151', display: 'block' }}>Částka (Kč):</label>
              <input 
                type="number" 
                placeholder="1000" 
                value={newAmount} 
                onChange={(e) => setNewAmount(e.target.value)} 
                required 
                style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#374151', display: 'block' }}>Den v měsíci (1–31):</label>
              <input 
                type="number" 
                min="1" 
                max="31" 
                value={newDay} 
                onChange={(e) => setNewDay(e.target.value)} 
                required 
                style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#374151', display: 'block' }}>Frekvence:</label>
              <select 
                value={newFrequency} 
                onChange={(e) => setNewFrequency(e.target.value as 'monthly' | 'quarterly')}
                style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px', boxSizing: 'border-box' }}
              >
                <option value="monthly">Měsíční</option>
                <option value="quarterly">Čtvrtletní (2, 5, 8, 11)</option>
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            style={{ padding: '6px 14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
          >
            Uložit platbu
          </button>
        </form>
      )}

      {/* TABULKA */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '6px 8px', width: '35px', textAlign: 'center' }}>Stav</th>
            <th style={{ padding: '6px 8px', width: '90px' }}>Splatnost</th>
            <th style={{ padding: '6px 8px' }}>Položka</th>
            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Částka</th>
            <th style={{ padding: '6px 8px', width: '30px', textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedPayments.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', background: p.paid ? '#fafafa' : 'white', opacity: p.paid ? 0.55 : 1 }}>
              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={p.paid} 
                  onChange={() => togglePaid(p.id)}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
              </td>
              <td style={{ padding: '5px 8px', color: '#6b7280', fontWeight: '500' }}>
                {p.day}. v měsíci
              </td>
              <td style={{ padding: '5px 8px', textDecoration: p.paid ? 'line-through' : 'none', fontWeight: p.paid ? 'normal' : '500' }}>
                {p.name}
                {p.months && <span style={{ fontSize: '10px', color: '#2563eb', marginLeft: '6px' }}>(čtvrtletní)</span>}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                {p.amount.toLocaleString('cs-CZ')} Kč
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                <button 
                  onClick={() => handleDeletePayment(p.id)}
                  title="Smazat platbu"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}