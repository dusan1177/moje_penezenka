import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface KidsExpense {
  id: number;
  month_id: number;
  title: string;
  amount: number;
}

interface KidsMonth {
  id: number;
  year: number;
  month_number: number;
  month_name: string;
  allowance: number;
  is_closed: boolean;
  expenses?: KidsExpense[];
}

const CZECH_MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
];

export default function KidsPage() {
  const [months, setMonths] = useState<KidsMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [newTitle, setNewTitle] = useState<{ [monthId: number]: string }>({});
  const [newAmount, setNewAmount] = useState<{ [monthId: number]: string }>({});

  useEffect(() => {
    fetchKidsData(selectedYear);
  }, [selectedYear]);

  const fetchKidsData = async (year: number) => {
    setLoading(true);
    try {
      const { data: monthsData, error: mError } = await supabase
        .from('kids_months')
        .select('*')
        .eq('year', year)
        .order('month_number', { ascending: true });

      const { data: expensesData, error: eError } = await supabase
        .from('kids_expenses')
        .select('*')
        .order('id', { ascending: true });

      if (mError) console.error('Chyba měsíců:', mError);
      if (eError) console.error('Chyba výdajů:', eError);

      if (monthsData && monthsData.length > 0) {
        const combined = monthsData.map((m) => ({
          ...m,
          expenses: (expensesData || []).filter((e) => e.month_id === m.id),
        }));
        setMonths(combined);
      } else {
        setMonths([]);
      }
    } catch (err) {
      console.error('Chyba při načítání:', err);
    } finally {
      setLoading(false);
    }
  };

  // Vytvoří 12 měsíců v databázi pro zvolený rok
  const handleSeedYear = async () => {
    setLoading(true);
    const newMonths = CZECH_MONTHS.map((name, index) => ({
      year: selectedYear,
      month_number: index + 1,
      month_name: name,
      allowance: 2500, // Základní příspěvek
      is_closed: false,
    }));

    const { error } = await supabase.from('kids_months').insert(newMonths);

    if (error) {
      console.error('Chyba při zakládání roku:', error);
      alert('Chyba při zakládání roku. Zkontroluj databázi.');
    } else {
      fetchKidsData(selectedYear);
    }
  };

  const toggleMonthClosed = async (monthId: number, currentClosed: boolean) => {
    const nextStatus = !currentClosed;
    setMonths((prev) =>
      prev.map((m) => (m.id === monthId ? { ...m, is_closed: nextStatus } : m))
    );

    await supabase
      .from('kids_months')
      .update({ is_closed: nextStatus })
      .eq('id', monthId);
  };

  const handleAddExpense = async (monthId: number, e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle[monthId]?.trim();
    const amountVal = parseFloat(newAmount[monthId] || '0');

    if (!title || !amountVal) return;

    const { data, error } = await supabase
      .from('kids_expenses')
      .insert([{ month_id: monthId, title, amount: amountVal }])
      .select();

    if (error) {
      console.error('Chyba při přidávání výdaje:', error);
    } else if (data) {
      setMonths((prev) =>
        prev.map((m) => {
          if (m.id === monthId) {
            return {
              ...m,
              expenses: [...(m.expenses || []), data[0]],
            };
          }
          return m;
        })
      );
      setNewTitle((prev) => ({ ...prev, [monthId]: '' }));
      setNewAmount((prev) => ({ ...prev, [monthId]: '' }));
    }
  };

  const handleDeleteExpense = async (monthId: number, expenseId: number) => {
    setMonths((prev) =>
      prev.map((m) => {
        if (m.id === monthId) {
          return {
            ...m,
            expenses: (m.expenses || []).filter((e) => e.id !== expenseId),
          };
        }
        return m;
      })
    );

    await supabase.from('kids_expenses').delete().eq('id', expenseId);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '60px' }}>
        <p className="label">Načítám data pro rok {selectedYear}...</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Přepínač let */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span className="label" style={{ margin: 0 }}>Rok:</span>
        {[2026, 2027].map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            style={{
              background: selectedYear === y ? 'var(--amber)' : 'var(--bg-card)',
              color: selectedYear === y ? '#1c1e26' : 'var(--text)',
              border: '1px solid var(--line)',
              padding: '6px 16px',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {months.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--line)' }}>
          <p className="label" style={{ marginBottom: '16px' }}>Pro rok {selectedYear} zatím neexistují žádné měsíce.</p>
          <button
            onClick={handleSeedYear}
            style={{
              background: 'var(--amber)',
              color: '#1c1e26',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Vytvořit 12 měsíců pro rok {selectedYear}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div>
            {months.slice(0, 6).map((m) => renderMonthCard(m, toggleMonthClosed, handleAddExpense, handleDeleteExpense, newTitle, setNewTitle, newAmount, setNewAmount))}
          </div>
          <div>
            {months.slice(6, 12).map((m) => renderMonthCard(m, toggleMonthClosed, handleAddExpense, handleDeleteExpense, newTitle, setNewTitle, newAmount, setNewAmount))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderMonthCard(
  m: KidsMonth,
  toggleMonthClosed: (id: number, status: boolean) => void,
  handleAddExpense: (id: number, e: React.FormEvent) => void,
  handleDeleteExpense: (mId: number, eId: number) => void,
  newTitle: { [key: number]: string },
  setNewTitle: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>,
  newAmount: { [key: number]: string },
  setNewAmount: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>
) {
  const totalExpenses = (m.expenses || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const toPay = m.allowance - totalExpenses / 2;

  // Barva textu pro vyřízený měsíc vs. běžný stav
  const itemTextColor = m.is_closed ? '#86efac' : 'var(--text)';
  const labelTextColor = m.is_closed ? '#86efac' : 'var(--text-dim)';

  return (
    <div
      key={m.id}
      style={{
        background: m.is_closed ? '#142a1f' : 'var(--bg-card)',
        border: `1px solid ${m.is_closed ? '#22c55e' : 'var(--line)'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', letterSpacing: '1px', color: m.is_closed ? '#4ade80' : 'var(--text)' }}>
          {m.month_name}
        </h3>
        <button
          onClick={() => toggleMonthClosed(m.id, m.is_closed)}
          style={{
            background: m.is_closed ? '#166534' : 'transparent',
            border: `1px solid ${m.is_closed ? '#22c55e' : 'var(--line)'}`,
            color: m.is_closed ? '#f0fdf4' : 'var(--text-dim)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {m.is_closed ? '✓ Vyřízeno' : 'Označit jako vyřízené'}
        </button>
      </div>

      {/* Seznam výdajů */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        {(m.expenses || []).map((exp) => (
          <div
            key={exp.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              borderBottom: `1px solid ${m.is_closed ? '#1e4620' : 'var(--line)'}`,
              paddingBottom: '4px',
              color: itemTextColor, // Světle zelená barva při vyřízení
            }}
          >
            <span>{exp.title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 500 }}>{exp.amount.toLocaleString('cs-CZ')} Kč</span>
              {!m.is_closed && (
                <button
                  onClick={() => handleDeleteExpense(m.id, exp.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0 2px',
                  }}
                  title="Smazat položku"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Formulář pro přidání položky */}
      {!m.is_closed && (
        <form
          onSubmit={(e) => handleAddExpense(m.id, e)}
          style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}
        >
          <input
            type="text"
            placeholder="Název (např. Posilovna)"
            value={newTitle[m.id] || ''}
            onChange={(e) => setNewTitle({ ...newTitle, [m.id]: e.target.value })}
            style={{
              flex: 2,
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              padding: '6px 8px',
              borderRadius: '4px',
              fontSize: '13px',
            }}
          />
          <input
            type="number"
            placeholder="Kč"
            value={newAmount[m.id] || ''}
            onChange={(e) => setNewAmount({ ...newAmount, [m.id]: e.target.value })}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              padding: '6px 8px',
              borderRadius: '4px',
              fontSize: '13px',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'var(--amber)',
              color: '#1c1e26',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </form>
      )}

      {/* Souhrnné řádky */}
      <div style={{ paddingTop: '8px', borderTop: `1px solid ${m.is_closed ? '#1e4620' : 'var(--line)'}`, fontSize: '13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: labelTextColor, marginBottom: '4px' }}>
          <span>Příspěvek na kluky:</span>
          <span>{m.allowance.toLocaleString('cs-CZ')} Kč</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 700,
            fontSize: '15px',
            color: m.is_closed ? '#4ade80' : 'var(--amber)',
            marginTop: '4px',
          }}
        >
          <span>Zaplatit:</span>
          <span>{toPay.toLocaleString('cs-CZ')} Kč</span>
        </div>
      </div>
    </div>
  );
}