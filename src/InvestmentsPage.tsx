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

interface OndraDebt {
  id: number;
  title: string;
  amount: number;
  note: string;
  monthlyPayment: number;
  date: string;
}

export function InvestmentsPage() {
  const [debts, setDebts] = useState<Debt[]>([
    { id: 1, name: 'Moneta', amount: 300000, monthlyPayment: 5564, endDate: '2031-08-15' },
    { id: 2, name: 'Raifka', amount: 39253, monthlyPayment: 6627, endDate: '2027-02-23' },
    { id: 3, name: 'ČSOB', amount: 2065726, monthlyPayment: 13639, endDate: '2047-08-20' },
  ]);
  const [newDebt, setNewDebt] = useState({ name: '', amount: '', monthlyPayment: '', endDate: '' });

  const [investments, setInvestments] = useState<Investment[]>([
    { id: 1, name: 'Rentea', currentValue: 504590, monthlySavings: 1700, note: 'Vojta' },
    { id: 2, name: 'Investice Amundi', currentValue: 356684.4, monthlySavings: 1500, note: '118894.8' },
    { id: 3, name: 'DIP Amundi', currentValue: 101547, monthlySavings: 4500, note: '' },
    { id: 4, name: 'Trading', currentValue: 90000, monthlySavings: 3600, note: '' },
  ]);
  const [newInv, setNewInv] = useState({ name: '', currentValue: '', monthlySavings: '', note: '' });

  const [ondraDebts, setOndraDebts] = useState<OndraDebt[]>([
    { id: 1, title: 'Ondra dluh', amount: 10500, note: 'splátky', monthlyPayment: 3000, date: '2026-09-01' },
    { id: 2, title: 'Ondra dluh 2', amount: 15500, note: 'splátka', monthlyPayment: 2000, date: '2026-09-18' },
  ]);
  const [newOndra, setNewOndra] = useState({ title: '', amount: '', note: '', monthlyPayment: '', date: '' });

  // Pomocné funkce pro úpravy řádků
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

  const handleOndraChange = (index: number, field: keyof OndraDebt, value: string | number) => {
    const updated = [...ondraDebts];
    updated[index] = { ...updated[index], [field]: value };
    setOndraDebts(updated);
  };

  // Přidávání položek
  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebt.name) return;
    setDebts([
      ...debts,
      {
        id: Date.now(),
        name: newDebt.name,
        amount: Number(newDebt.amount) || 0,
        monthlyPayment: Number(newDebt.monthlyPayment) || 0,
        endDate: newDebt.endDate,
      },
    ]);
    setNewDebt({ name: '', amount: '', monthlyPayment: '', endDate: '' });
  };

  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.name) return;
    setInvestments([
      ...investments,
      {
        id: Date.now(),
        name: newInv.name,
        currentValue: Number(newInv.currentValue) || 0,
        monthlySavings: Number(newInv.monthlySavings) || 0,
        note: newInv.note,
      },
    ]);
    setNewInv({ name: '', currentValue: '', monthlySavings: '', note: '' });
  };

  const handleAddOndra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOndra.title) return;
    setOndraDebts([
      ...ondraDebts,
      {
        id: Date.now(),
        title: newOndra.title,
        amount: Number(newOndra.amount) || 0,
        note: newOndra.note,
        monthlyPayment: Number(newOndra.monthlyPayment) || 0,
        date: newOndra.date,
      },
    ]);
    setNewOndra({ title: '', amount: '', note: '', monthlyPayment: '', date: '' });
  };

  const totalDebtAmount = debts.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalDebtMonthly = debts.reduce((acc, item) => acc + Number(item.monthlyPayment || 0), 0);

  const totalInvValue = investments.reduce((acc, item) => acc + Number(item.currentValue || 0), 0);
  const totalInvMonthly = investments.reduce((acc, item) => acc + Number(item.monthlySavings || 0), 0);

  const totalOndraAmount = ondraDebts.reduce((acc, item) => acc + Number(item.amount || 0), 0);

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
        <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-2">
          <input
            type="text"
            placeholder="Název"
            value={newDebt.name}
            onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Částka"
            value={newDebt.amount}
            onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Splátka"
            value={newDebt.monthlyPayment}
            onChange={(e) => setNewDebt({ ...newDebt, monthlyPayment: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="date"
            value={newDebt.endDate}
            onChange={(e) => setNewDebt({ ...newDebt, endDate: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-1 hover:bg-blue-700">
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
            value={newInv.name}
            onChange={(e) => setNewInv({ ...newInv, name: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Hodnota"
            value={newInv.currentValue}
            onChange={(e) => setNewInv({ ...newInv, currentValue: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Spořená částka"
            value={newInv.monthlySavings}
            onChange={(e) => setNewInv({ ...newInv, monthlySavings: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="text"
            placeholder="Poznámka"
            value={newInv.note}
            onChange={(e) => setNewInv({ ...newInv, note: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <button type="submit" className="bg-green-600 text-white rounded px-4 py-1 hover:bg-green-700">
            Přidat investici
          </button>
        </form>
      </section>

      {/* 3. ODDÍL: ONDRA DLUHY */}
      <section className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-semibold text-amber-600">3. Ondra dluhy</h2>
          <div className="text-sm font-medium">
            Celkem: {totalOndraAmount.toLocaleString()} Kč
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="p-2">Popis</th>
                <th className="p-2">Částka</th>
                <th className="p-2">Poznámka</th>
                <th className="p-2">Splátka</th>
                <th className="p-2">Datum</th>
              </tr>
            </thead>
            <tbody>
              {ondraDebts.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleOndraChange(index, 'title', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleOndraChange(index, 'amount', Number(e.target.value))}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => handleOndraChange(index, 'note', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.monthlyPayment}
                      onChange={(e) => handleOndraChange(index, 'monthlyPayment', Number(e.target.value))}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => handleOndraChange(index, 'date', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form onSubmit={handleAddOndra} className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-2">
          <input
            type="text"
            placeholder="Popis"
            value={newOndra.title}
            onChange={(e) => setNewOndra({ ...newOndra, title: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Částka"
            value={newOndra.amount}
            onChange={(e) => setNewOndra({ ...newOndra, amount: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="text"
            placeholder="Poznámka"
            value={newOndra.note}
            onChange={(e) => setNewOndra({ ...newOndra, note: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Splátka"
            value={newOndra.monthlyPayment}
            onChange={(e) => setNewOndra({ ...newOndra, monthlyPayment: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="date"
            value={newOndra.date}
            onChange={(e) => setNewOndra({ ...newOndra, date: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <button type="submit" className="bg-amber-600 text-white rounded px-4 py-1 hover:bg-amber-700 md:col-span-5">
            Přidat Ondra dluh
          </button>
        </form>
      </section>
    </div>
  );
}