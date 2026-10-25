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

interface PaymentItem {
  id: number;
  ondra_debt_id: number;
  amount: number;
  date: string;
}

interface OndraDebt {
  id: number;
  title: string;
  originalAmount: number;
  note: string;
  payments: PaymentItem[];
}

export function InvestmentsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [ondraDebts, setOndraDebts] = useState<OndraDebt[]>([]);
  const [loading, setLoading] = useState(true);

  // Načtení dat ze Supabase při startu
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Načtení dluhů
      const { data: debtsData } = await supabase.from('debts').select('*').order('id');
      if (debtsData) setDebts(debtsData);

      // 2. Načtení investic
      const { data: invData } = await supabase.from('investments').select('*').order('id');
      if (invData) {
        // Převedení názvů sloupců z DB na camelCase pro komponentu
        const formattedInv = invData.map((item: any) => ({
          id: item.id,
          name: item.name,
          currentValue: item.current_value,
          monthlySavings: item.monthly_savings,
          note: item.note || '',
        }));
        setInvestments(formattedInv);
      }

      // 3. Načtení Ondrových dluhů a jejich splátek
      const { data: ondraData } = await supabase.from('ondra_debts').select('*').order('id');
      const { data: paymentsData } = await supabase.from('ondra_payments').select('*');

      if (ondraData) {
        const combined = ondraData.map((d: any) => ({
          id: d.id,
          title: d.title,
          originalAmount: d.original_amount,
          note: d.note || '',
          payments: (paymentsData || [])
            .filter((p: any) => p.ondra_debt_id === d.id)
            .map((p: any) => ({
              id: p.id,
              ondra_debt_id: p.ondra_debt_id,
              amount: p.amount,
              date: p.date,
            })),
        }));
        setOndraDebts(combined);
      }
    } catch (err) {
      console.error('Chyba při načítání investic a dluhů:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- AKTUALIZACE DLUHŮ ---
  const handleDebtChange = async (index: number, field: keyof Debt, value: string | number) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: value };
    setDebts(updated);

    const item = updated[index];
    await supabase
      .from('debts')
      .update({
        name: item.name,
        amount: item.amount,
        monthly_payment: item.monthlyPayment,
        end_date: item.endDate,
      })
      .eq('id', item.id);
  };

  // --- AKTUALIZACE INVESTIC ---
  const handleInvestmentChange = async (index: number, field: keyof Investment, value: string | number) => {
    const updated = [...investments];
    updated[index] = { ...updated[index], [field]: value };
    setInvestments(updated);

    const item = updated[index];
    await supabase
      .from('investments')
      .update({
        name: item.name,
        current_value: item.currentValue,
        monthly_savings: item.monthlySavings,
        note: item.note,
      })
      .eq('id', item.id);
  };

  // --- AKTUALIZACE ONDRA DLUHŮ & SPLÁTEK ---
  const handleOndraHeaderChange = async (debtIndex: number, field: 'title' | 'originalAmount', value: string | number) => {
    const updated = [...ondraDebts];
    updated[debtIndex] = { ...updated[debtIndex], [field]: value };
    setOndraDebts(updated);

    const item = updated[debtIndex];
    await supabase
      .from('ondra_debts')
      .update({
        title: item.title,
        original_amount: item.originalAmount,
      })
      .eq('id', item.id);
  };

  const handleOndraPaymentChange = async (debtIndex: number, paymentIndex: number, field: 'amount' | 'date', value: string | number) => {
    const updated = [...ondraDebts];
    const payments = [...updated[debtIndex].payments];
    payments[paymentIndex] = {
      ...payments[paymentIndex],
      [field]: field === 'amount' ? Number(value) || 0 : value,
    };
    updated[debtIndex] = { ...updated[debtIndex], payments };
    setOndraDebts(updated);

    const pay = payments[paymentIndex];
    await supabase
      .from('ondra_payments')
      .update({
        amount: pay.amount,
        date: pay.date,
      })
      .eq('id', pay.id);
  };

  const handleAddPayment = async (debtIndex: number) => {
    const debt = ondraDebts[debtIndex];
    const todayStr = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ondra_payments')
      .insert([{ ondra_debt_id: debt.id, amount: 0, date: todayStr }])
      .select();

    if (!error && data) {
      const updated = [...ondraDebts];
      updated[debtIndex].payments.push({
        id: data[0].id,
        ondra_debt_id: debt.id,
        amount: 0,
        date: todayStr,
      });
      setOndraDebts(updated);
    }
  };

  const handleDeletePayment = async (debtIndex: number, paymentIndex: number) => {
    const payment = ondraDebts[debtIndex].payments[paymentIndex];
    
    const { error } = await supabase
      .from('ondra_payments')
      .delete()
      .eq('id', payment.id);

    if (!error) {
      const updated = [...ondraDebts];
      updated[debtIndex].payments.splice(paymentIndex, 1);
      setOndraDebts(updated);
    }
  };

  const totalDebtAmount = debts.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalDebtMonthly = debts.reduce((acc, item) => acc + Number(item.monthlyPayment || 0), 0);

  const totalInvValue = investments.reduce((acc, item) => acc + Number(item.currentValue || 0), 0);
  const totalInvMonthly = investments.reduce((acc, item) => acc + Number(item.monthlySavings || 0), 0);

  const totalOndraRemaining = ondraDebts.reduce((acc, item) => {
    const paidSum = item.payments.reduce((pAcc, p) => pAcc + Number(p.amount || 0), 0);
    return acc + (Number(item.originalAmount || 0) - paidSum);
  }, 0);

  if (loading) {
    return <div className="p-6 text-center">Načítám investice a dluhy z databáze...</div>;
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
                      value={item.endDate}
                      onChange={(e) => handleDebtChange(index, 'endDate', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      </section>

      {/* 3. ODDÍL: ONDRA DLUHY */}
      <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-semibold text-amber-600">3. Ondra dluhy</h2>
          <div className="text-sm font-medium">
            Celkem zbývá: <span className="text-amber-600 font-bold">{totalOndraRemaining.toLocaleString()} Kč</span>
          </div>
        </div>

        {ondraDebts.map((debt, debtIndex) => {
          const totalPaid = debt.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
          const currentRemaining = debt.originalAmount - totalPaid;

          return (
            <div key={debt.id} className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-gray-600">
                      <th className="p-2">Popis dluhu</th>
                      <th className="p-2">Původní částka</th>
                      <th className="p-2">Aktuální zbývající dluh</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-gray-50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={debt.title}
                          onChange={(e) => handleOndraHeaderChange(debtIndex, 'title', e.target.value)}
                          className="border rounded px-2 py-1 w-full bg-white font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={debt.originalAmount}
                          onChange={(e) => handleOndraHeaderChange(debtIndex, 'originalAmount', Number(e.target.value))}
                          className="border rounded px-2 py-1 w-full bg-white font-medium"
                        />
                      </td>
                      <td className="p-2 font-bold text-amber-700">
                        {currentRemaining.toLocaleString()} Kč
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Seznam splátek */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Historie splátek:</span>
                  <button
                    type="button"
                    onClick={() => handleAddPayment(debtIndex)}
                    className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                  >
                    + Přidat splátku
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-gray-600 text-sm">
                        <th className="p-2">Částka splátky</th>
                        <th className="p-2">Datum splátky</th>
                        <th className="p-2 w-16">Akce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debt.payments.map((payment, pIndex) => (
                        <tr key={payment.id} className="border-b">
                          <td className="p-2">
                            <input
                              type="number"
                              value={payment.amount}
                              onChange={(e) => handleOndraPaymentChange(debtIndex, pIndex, 'amount', e.target.value)}
                              className="border rounded px-2 py-1 w-full text-sm"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={payment.date}
                              onChange={(e) => handleOndraPaymentChange(debtIndex, pIndex, 'date', e.target.value)}
                              className="border rounded px-2 py-1 w-full text-sm"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(debtIndex, pIndex)}
                              className="text-red-500 hover:text-red-700 font-bold px-2 py-1 text-sm"
                              title="Smazat splátku"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}