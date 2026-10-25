import { useState } from 'react';

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
  const [debts, setDebts] = useState<Debt[]>([
    { id: 1, name: 'Moneta', amount: 300000, monthlyPayment: 5564, endDate: '2031-08-15' },
    { id: 2, name: 'Raifka', amount: 39253, monthlyPayment: 6627, endDate: '2027-02-23' },
    { id: 3, name: 'ČSOB', amount: 2065726, monthlyPayment: 13639, endDate: '2047-08-20' },
  ]);

  const [investments, setInvestments] = useState<Investment[]>([
    { id: 1, name: 'Rentea', currentValue: 504590, monthlySavings: 1700, note: 'Vojta' },
    { id: 2, name: 'Investice Amundi', currentValue: 356684.4, monthlySavings: 1500, note: '118894.8' },
    { id: 3, name: 'DIP Amundi', currentValue: 101547, monthlySavings: 4500, note: '' },
    { id: 4, name: 'Trading', currentValue: 90000, monthlySavings: 3600, note: '' },
  ]);

  const [ondraDebts, setOndraDebts] = useState<OndraDebt[]>([
    {
      id: 1,
      title: 'Ondra dluh',
      originalAmount: 15500,
      note: 'splátky',
      payments: [
        { id: 1, amount: 3000, date: '2026-09-01' },
        { id: 2, amount: 2000, date: '2026-09-18' },
      ],
    },
  ]);

  const handleDebtChange = (index: number, field: keyof Debt, value: string | number) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: value };
    setDebts(updated);
  };

  const handleInvestmentChange = (index: number, field: keyof Investment, value: string | number) => {
    const updated = [...investments];
    updated[index] = { ...updated[index], [field]: value };
    setInvestments(updated);
  };

  // Správa splátek u Ondry v tabulkovém zobrazení
  const handleOndraPaymentChange = (debtIndex: number, paymentIndex: number, field: 'amount' | 'date', value: string | number) => {
    const updated = [...ondraDebts];
    const payments = [...updated[debtIndex].payments];
    payments[paymentIndex] = {
      ...payments[paymentIndex],
      [field]: field === 'amount' ? Number(value) || 0 : value,
    };
    updated[debtIndex] = { ...updated[debtIndex], payments };
    setOndraDebts(updated);
  };

  const handleAddPayment = (debtIndex: number) => {
    const updated = [...ondraDebts];
    updated[debtIndex].payments.push({
      id: Date.now(),
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setOndraDebts(updated);
  };

  const handleDeletePayment = (debtIndex: number, paymentIndex: number) => {
    const updated = [...ondraDebts];
    updated[debtIndex].payments.splice(paymentIndex, 1);
    setOndraDebts(updated);
  };

  const totalDebtAmount = debts.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalDebtMonthly = debts.reduce((acc, item) => acc + Number(item.monthlyPayment || 0), 0);

  const totalInvValue = investments.reduce((acc, item) => acc + Number(item.currentValue || 0), 0);
  const totalInvMonthly = investments.reduce((acc, item) => acc + Number(item.monthlySavings || 0), 0);

  const totalOndraRemaining = ondraDebts.reduce((acc, item) => {
    const paidSum = item.payments.reduce((pAcc, p) => pAcc + Number(p.amount || 0), 0);
    return acc + (Number(item.originalAmount || 0) - paidSum);
  }, 0);

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
              {/* Hlavní údaje dluhu v tabulkovém designu */}
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
                          onChange={(e) => {
                            const updated = [...ondraDebts];
                            updated[debtIndex].title = e.target.value;
                            setOndraDebts(updated);
                          }}
                          className="border rounded px-2 py-1 w-full bg-white font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={debt.originalAmount}
                          onChange={(e) => {
                            const updated = [...ondraDebts];
                            updated[debtIndex].originalAmount = Number(e.target.value) || 0;
                            setOndraDebts(updated);
                          }}
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

              {/* Seznam splátek v čisté tabulce */}
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