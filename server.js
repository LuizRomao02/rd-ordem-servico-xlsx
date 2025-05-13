const express = require('express');
const fs = require('fs');
const XLSX = require('xlsx');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const FILE_PATH = './database.xlsx';

if (!fs.existsSync(FILE_PATH)) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[
    'ID OS', 'Data', 'Setor', 'Solicitante', 'Equipamento',
    'Motivo', 'Recebido', 'Nome', 'Tipo', 'Descrição',
    'Material', 'Mão de Obra', 'Tempo Previsto', 'Tempo Utilizado',
    'Finalização', 'Assinatura'
  ]]);
  XLSX.utils.book_append_sheet(wb, ws, 'Ordens');
  XLSX.writeFile(wb, FILE_PATH);
}

// Salvar nova ordem
app.post('/salvar', (req, res) => {
  const novaOrdem = req.body;
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets['Ordens'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  novaOrdem.id = data.length; // próxima linha

  data.push([
    novaOrdem.id, novaOrdem.data, novaOrdem.setor, novaOrdem.solicitante, novaOrdem.equipamento,
    novaOrdem.motivo, novaOrdem.recebido, novaOrdem.nome, novaOrdem.tipo, novaOrdem.descricao,
    novaOrdem.material, novaOrdem.mao, novaOrdem.tempoPrevisto, novaOrdem.tempoUtilizado,
    novaOrdem.finalizacao, novaOrdem.assinatura
  ]);

  const novaPlanilha = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets['Ordens'] = novaPlanilha;
  XLSX.writeFile(workbook, FILE_PATH);
  res.json({ sucesso: true });
});

// Listar ordens
app.get('/listar', (req, res) => {
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets['Ordens'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  res.json({ dados: data.slice(1) }); // remove cabeçalho
});

// Remover por ID
app.delete('/remover/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets['Ordens'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const index = data.findIndex((row, i) => i > 0 && row[0] === id);
  if (index === -1) {
    return res.status(404).json({ sucesso: false, mensagem: "OS não encontrada." });
  }

  data.splice(index, 1); // remove a linha
  const novaPlanilha = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets['Ordens'] = novaPlanilha;
  XLSX.writeFile(workbook, FILE_PATH);

  res.json({ sucesso: true });
});

app.listen(3000, () => {
  console.log('🚀 Servidor rodando em http://localhost:3000');
});
