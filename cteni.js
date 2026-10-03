import XLSX from 'xlsx';

const workbook = XLSX.readFile('Finance_V2.xlsm', { cellFormulas: true });

console.log('--- SEZNAM LISTŮ ---');
console.log(workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n================ ISŤ: ${sheetName} ================`);
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

  // Vypíšeme prvních 25 řádků každého listu
  json.slice(0, 25).forEach((row, i) => {
    if (row.length > 0) {
      console.log(`R${i + 1}:`, row.filter(cell => cell !== undefined && cell !== '').join(' | '));
    }
  });
});