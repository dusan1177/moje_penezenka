import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface Debt {
  id: number;
  name: string;
  amount: number;
  monthlyPayment: number;
  endDate: string;
}

interface Investment {
  id: number;
  name: string;
  currentValue: number;
  monthlySavings: number;
  note: string;
}

interface OndraDebt {
  id: number;
  title: string;
  originalAmount: number;
  note: string;
}

interface OndraPayment {
  id: number;
  ondraDebtId: number;
  amount: number;
  date: string;
}

export function InvestmentsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  
  // Stavy pro Ondrovy dluhy
  const [ondraDebt, setOndraDebt] = useState<OndraDebt | null>(null);
  const [ondraPayments, setOndraPayments] = useState<OndraPayment[]>([]);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState('');

  const [loading, setLoading] = useState(true);

  // Stavy pro formuláře Dluhů a Investic
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtMonthly, setNewDebtMonthly] = useState('');
  const [newDebtEndDate, setNewDebtEndDate] = useState('');

  const [newInvName, setNewInvName] = useState('');
  const [newInvValue, setNewInvValue] = useState('');
  const [newInvMonthly, setNewInvMonthly] = useState('');
  const [newInvNote, setNewInvNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Dluhy
      const { data: debtsData } = await supabase.from('debts').select('*').order('id');
      if (debtsData) {
        const formattedDebts = debtsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          amount: item.amount,
          monthlyPayment: item.monthly_payment || 0,
          endDate: item.end_date || '',
        }));
        setDebts(formattedDebts);
      }

      // 2. Investice
      const { data: invData } = await supabase.from('investments').select('*').order('id');
      if (invData) {
        const formattedInv = invData.map((item: any) => ({
          id: item.id,
          name: item.name,
          currentValue: item.current_value,
          monthlySavings: item.monthly_savings,
          note: item.note || '',
        }));
        setInvestments(formattedInv);
      }

      // 3. Ondrovy dluhy a splátky
      const { data: oDebtsData } = await supabase.from('ondra_debts').select('*').limit(1);
      if (oDebtsData && oDebtsData.length > 0) {
        setOndraDebt({
          id: oDebtsData[0].id,
          title: oDebtsData[0].title,
          originalAmount: oDebtsData[0].original_amount,
          note: oDebtsData[0].note || '',
        });

        const { data: oPayData } = await supabase
          .from('ondra_payments')
          .select('*')
          .eq('ondra_debt_id', oDebtsData[0].id)
          .order('id');

        if (oPayData) {
          const formattedPayments = oPayData.map((p: any) => ({
            id: p.id,
            ondraDebtId: p.ondra_debt_id,
            amount: p.amount,
            date: p.date || '',
          }));
          setOndraPayments(formattedPayments);
        }
      }
    } catch (err) {
      console.error('Chyba při načítání:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtName) return;

    const { data, error } = await supabase
      .from('debts')
      .insert([{
        name: newDebtName,
        amount: Number(newDebtAmount) || 0,
        monthly_payment: Number(newDebtMonthly) || 0,
        end_date: newDebtEndDate || null,
      }])
      .select();

    if (!error && data && data[0]) {
      const addedDebt: Debt = {
        id: data[0].id,
        name: data[0].name,
        amount: data[0].amount,
        monthlyPayment: data[0].monthly_payment || 0,
        endDate: data[0].end_date || '',
      };
      setDebts([...debts, addedDebt]);
      setNewDebtName('');
      setNewDebtAmount('');
      setNewDebtMonthly('');
      setNewDebtEndDate('');
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName) return;

    const { data, error } = await supabase
      .from('investments')
      .insert([{
        name: newInvName,
        current_value: Number(newInvValue) || 0,
        monthly_savings: Number(newInvMonthly) || 0,
        note: newInvNote,
      }])
      .select();

    if (!error && data && data[0]) {
      const newItem: Investment = {
        id: data[0].id,
        name: data[0].name,
        currentValue: data[0].current_value,
        monthlySavings: data[0].monthly_savings,
        note: data[0].note || '',
      };
      setInvestments([...investments, newItem]);
      setNewInvName('');
      setNewInvValue('');
      setNewInvMonthly('');
      setNewInvNote('');
    }
  };

  const handleAddOndraPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ondraDebt || !newPaymentAmount) return;

    const { data, error } = await supabase
      .from('ondra_payments')
      .insert([{
        ondra_debt_id: ondraDebt.id,
        amount: Number(newPaymentAmount) || 0,
        date: newPaymentDate || null,
      }])
      .select();

    if (!error && data && data[0]) {
      const newPay: OndraPayment = {
        id: data[0].id,
        ondraDebtId: data[0].ondra_debt_id,
        amount: data[0].amount,
        date: data[0].date || '',
      };
      setOndraPayments([...ondraPayments, newPay]);
      setNewPaymentAmount('');
      setNewPaymentDate('');
    }
  };

  const handleDebtChange = async (index: number, field: keyof Debt, value: string | number) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: value };
    setDebts(updated);

    const item = updated[index];
    await supabase.from('debts').update({
      name: item.name,
      amount: item.amount,
      monthly_payment: item.monthlyPayment,
      end_date: item.endDate,
    }).eq('id', item.id);
  };

  const handleInvestmentChange = async (index: number, field: keyof Investment, value: string | number) => {
    const updated = [...investments];
    updated[index] = { ...updated[index], [field]: value };
    setInvestments(updated);

    const item = updated[index];
    await supabase.from('investments').update({
      name: item.name,
      current_value: item.currentValue,
      monthly_savings: item.monthlySavings,
      note: item.note,
    }).eq('id', item.id);
  };

  // Výpočty
  const totalDebtAmount = debts.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalDebtMonthly = debts.reduce((acc, item) => acc + Number(item.monthlyPayment || 0), 0);

  const totalInvValue = investments.reduce((acc, item) => acc + Number(item.currentValue || 0), 0);
  const totalInvMonthly = investments.reduce((acc, item) => acc + Number(item.monthlySavings || 0), 0);

  const ondraTotalPayments = ondraPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const ondraOriginal = ondraDebt ? Number(ondraDebt.originalAmount || 0) : 15500;
  const ondraRemaining = ondraOriginal - ondraTotalPayments;

  if (loading) {
    return <div className="p-6 text-center">Načítám...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Investice a dluhy</h1>

      {/* 1. ODDÍL: DLUHY */}
      <section className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-semibold text-red-600">1. Dluhy</h2>
          <div className="text-sm font-medium">
            Celkem: {totalDebtAmount.toLocaleString()} Kč | Splátka měsíčně: {totalDebtMonthly.toLocaleString()} Kč
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="p-2">Název</th>
                <th className="p-2">Částka</th>
                <th className="p-2">Splátka</th>
                <th className="p-2">Konec</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleDebtChange(index, 'name', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleDebtChange(index, 'amount', Number(e.target.value))}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.monthlyPayment}
                      onChange={(e) => handleDebtChange(index, 'monthlyPayment', Number(e.target.value))}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={item.endDate || ''}
                      onChange={(e) => handleDebtChange(index, 'endDate', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-2">
          <input
            type="text"
            placeholder="Název"
            value={newDebtName}
            onChange={(e) => setNewDebtName(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Částka"
            value={newDebtAmount}
            onChange={(e) => setNewDebtAmount(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Splátka"
            value={newDebtMonthly}
            onChange={(e) => setNewDebtMonthly(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="date"
            value={newDebtEndDate}
            onChange={(e) => setNewDebtEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-1 hover:bg-blue-700 font-medium">
            Přidat dluh
          </button>
        </form>
      </section>

      {/* 2. ODDÍL: INVESTICE */}
      <section className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-semibold text-green-600">2. Investice</h2>
          <div className="text-sm font-medium">
            Celkem hodnota: {totalInvValue.toLocaleString()} Kč | Spořená částka: {totalInvMonthly.toLocaleString()} Kč
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="p-2">Název</th>
                <th className="p-2">Částka / Hodnota</th>
                <th className="p-2">Spořená částka</th>
                <th className="p-2">Poznámka</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleInvestmentChange(index, 'name', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.currentValue}
                      onChange={(e) => handleInvestmentChange(index, 'currentValue', Number(e.target.value))}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.monthlySavings}
                      onChange={(e) => handleInvestmentChange(index, 'monthlySavings', Number(e.target.value))}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => handleInvestmentChange(index, 'note', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form onSubmit={handleAddInvestment} className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-2">
          <input
            type="text"
            placeholder="Název"
            value={newInvName}
            onChange={(e) => setNewInvName(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Hodnota"
            value={newInvValue}
            onChange={(e) => setNewInvValue(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Spořená částka"
            value={newInvMonthly}
            onChange={(e) => setNewInvMonthly(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="text"
            placeholder="Poznámka"
            value={newInvNote}
            onChange={(e) => setNewInvNote(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button type="submit" className="bg-green-600 text-white rounded px-4 py-1 hover:bg-green-700 font-medium">
            Přidat investici
          </button>
        </form>
      </section>

      {/* 3. ODDÍL: ONDRA DLUHY */}
      <section className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-semibold text-orange-600">3. Ondra dluh</h2>
          <div className="text-sm font-medium">
            Původní částka: {ondraOriginal.toLocaleString()} Kč | Zbývá dlužit: <span className="text-red-600 font-bold">{ondraRemaining.toLocaleString()} Kč</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="p-2">Splátka (částka)</th>
                <th className="p-2">Datum splátky</th>
              </tr>
            </thead>
            <tbody>
              {ondraPayments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="p-2 font-medium">{payment.amount.toLocaleString()} Kč</td>
                  <td className="p-2 text-gray-600">{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddOndraPayment} className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
          <input
            type="number"
            placeholder="Částka splátky"
            value={newPaymentAmount}
            onChange={(e) => setNewPaymentAmount(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <input
            type="date"
            value={newPaymentDate}
            onChange={(e) => setNewPaymentDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button type="submit" className="bg-orange-600 text-white rounded px-4 py-1 hover:bg-orange-700 font-medium">
            Přidat splátku
          </button>
        </form>
      </section>
    </div>
  );
}