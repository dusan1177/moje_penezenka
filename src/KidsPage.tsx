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

export default function KidsPage() {
  const [months, setMonths] = useState<KidsMonth[]>([]);
  const [loading, setLoading] = useState(true);

  // Stav pro formulář přidání výdaje (ukládá month_id, název a částku)
  const [newTitle, setNewTitle] = useState<{ [monthId: number]: string }>({});
  const [newAmount, setNewAmount] = useState<{ [monthId: number]: string }>({});

  useEffect(() => {
    fetchKidsData();
  }, []);

  const fetchKidsData = async () => {
    setLoading(true);
    try {
      const { data: monthsData, error: mError } = await supabase
        .from('kids_months')
        .select('*')
        .eq('year', 2026)
        .order('month_number', { ascending: true });

      const { data: expensesData, error: eError } = await supabase
        .from('kids_expenses')
        .select('*')
        .order('id', { ascending: true });

      if (mError) console.error('Chyba měsíců:', mError);
      if (eError) console.error('Chyba výdajů:', eError);

      if (monthsData) {
        const combined = monthsData.map((m) => ({
          ...m,
          expenses: (expensesData || []).filter((e) => e.month_id === m.id),
        }));
        setMonths(combined);
      }
    } catch (err) {
      console.error('Chyba při načítání:', err);
    } finally {
      setLoading(false);
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
      <div className="wrap" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p className="label">Načítám data pro kluky...</p>
      </div>
    );
  }

  const leftColumnMonths = months.slice(0, 6);
  const rightColumnMonths = months.slice(6, 12);

  const renderMonthCard = (m: KidsMonth) => {
    const totalExpenses = (m.expenses || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const toPay = m.allowance - totalExpenses / 2;

    return (
      <div
        key={m.id}
        className={`kids-card ${m.is_closed ? 'closed' : ''}`}
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
                borderBottom: '1px border-box var(--line)',
                paddingBottom: '4px',
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
              placeholder="Název (např. Vojta posilovna)"
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
        <div style={{ paddingTop: '8px', borderTop: '1px solid var(--line)', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', marginBottom: '4px' }}>
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
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      <div>{leftColumnMonths.map(renderMonthCard)}</div>
      <div>{rightColumnMonths.map(renderMonthCard)}</div>
    </div>
  );
}