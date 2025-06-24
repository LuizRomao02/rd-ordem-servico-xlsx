let currentPage = 1;
const rowsPerPage = 20;
let allData = [], filteredData = [];

function formatarDataBR(isoString) {
    if (!isoString || !isoString.includes('-')) return isoString;
    const [ano, mes, dia] = isoString.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const dataIds = ['data', 'finalizacao', 'filterData', 'filterFinalizacao'];
    dataIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.type = 'date';
    });

    const observer = new MutationObserver(() => {
        document.querySelectorAll('#os-table tbody tr').forEach(row => {
            const dataTd = row.cells[1];
            const finalizacaoTd = row.cells[14];
            if (dataTd && !dataTd.dataset.formatado) {
                dataTd.textContent = formatarDataBR(dataTd.textContent);
                dataTd.dataset.formatado = true;
            }
            if (finalizacaoTd && !finalizacaoTd.dataset.formatado) {
                finalizacaoTd.textContent = formatarDataBR(finalizacaoTd.textContent);
                finalizacaoTd.dataset.formatado = true;
            }
        });
    });

    observer.observe(document.querySelector('#os-table tbody'), { childList: true, subtree: true });

});

async function fetchData() {
  try {
    const res = await fetch('/listar');
    const json = await res.json();
    allData = json.dados || [];
    filteredData = allData;
    renderTable();
  } catch (e) {
    alert('Erro ao carregar dados da base.');
    console.error(e);
  }
}


function renderTable() {
  const tableBody = document.querySelector('#os-table tbody');
  tableBody.innerHTML = '';
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filteredData.slice(start, end);

  pageData.forEach(row => {
    const tr = document.createElement('tr');

    const campos = [
      'id', 'data', 'setor', 'solicitante', 'equipamento',
      'motivo', 'recebido', 'nome', 'tipo', 'descricao',
      'material', 'mao', 'tempo_previsto', 'tempo_utilizado',
      'finalizacao', 'pendencia', 'assinatura'
    ];

    campos.forEach(campo => {
      const td = document.createElement('td');
      td.textContent = row[campo] || '';
      tr.appendChild(td);
    });

    // Ações
    const tdAcoes = document.createElement('td');

    // Botão Remover
    const btnRemover = document.createElement('button');
    btnRemover.textContent = 'Remover';
    btnRemover.className = 'btn-acao-remover';
    btnRemover.onclick = () => removerOrdem(row.id);
    tdAcoes.appendChild(btnRemover);

    // Botão Imprimir
    const printBtn = document.createElement('button');
    printBtn.textContent = '🖨 Imprimir';
    printBtn.className = 'btn-acao-imprimir';
    printBtn.style.marginLeft = '5px';
    printBtn.onclick = () => imprimirOrdem(row);
    tdAcoes.appendChild(printBtn);

    // Botão Adicionar Pendência
    const btnPendencia = document.createElement('button');
    btnPendencia.textContent = '➕ Pendência';
    btnPendencia.className = 'btn-acao-pendencia';
    btnPendencia.style.marginLeft = '5px';
    btnPendencia.onclick = () => adicionarPendencia(row.id);
    tdAcoes.appendChild(btnPendencia);

    tr.appendChild(tdAcoes);
    tableBody.appendChild(tr);
  });

  document.getElementById('page-indicator').textContent =
    `Página ${currentPage} de ${Math.ceil(filteredData.length / rowsPerPage)}`;
}

function adicionarPendencia(id) {
  const novaPendencia = prompt('Digite a nova pendência:');
  if (!novaPendencia) return;

  const senha = prompt('Digite a senha para confirmar:');
  if (!senha) return;

  fetch(`/atualizar-pendencia/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-btn-password': senha
    },
    body: JSON.stringify({ pendencia: novaPendencia })
  })
  .then(res => res.json())
  .then(res => {
    if (res.sucesso) {
      alert('Pendência atualizada com sucesso!');
      fetchData();
    } else {
      alert(res.mensagem || 'Erro ao atualizar pendência.');
    }
  })
  .catch(err => {
    console.error(err);
    alert('Erro ao conectar com o servidor.');
  });
}


function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) {
        currentPage++;
        renderTable();
    }
}

async function adicionarOrdem() {
    const campos = ['data', 'setor', 'solicitante', 'equipamento', 'motivo', 'recebido', 'nome', 'tipo', 'descricao', 'material', 'mao', 'tempo_previsto', 'tempo_utilizado', 'finalizacao', 'assinatura', 'pendencia'];
    const ordem = {};
    campos.forEach(id => ordem[id] = document.getElementById(id).value);
    if (Object.values(ordem).some(v => !v)) return alert('Preencha todos os campos.');

    try {
        const res = await fetch('/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ordem)
        });
        const json = await res.json();
        if (json.sucesso) {
            alert('Ordem salva com sucesso!');
            fetchData();
            campos.forEach(id => document.getElementById(id).value = '');
        }
    } catch (e) {
        alert('Erro ao salvar OS.');
        console.error(e);
    }
}

function applyFilters() {
    const data = document.getElementById('filterData').value;
    const setor = document.getElementById('filterSetor').value.toLowerCase();
    const tipo = document.getElementById('filterTipo').value.toLowerCase();
    const solicitante = document.getElementById('filterSolicitante').value.toLowerCase();

    filteredData = allData.filter(row =>
        (data === '' || (row[1] && row[1].startsWith(data))) &&
        (setor === '' || (row[2] && row[2].toLowerCase().includes(setor))) &&
        (tipo === '' || (row[8] && row[8].toLowerCase().includes(tipo))) &&
        (solicitante === '' || (row[3] && row[3].toLowerCase().includes(solicitante)))
    );

    currentPage = 1;
    renderTable();
}


function clearFilters() {
    document.getElementById('filterSetor').value = '';
    document.getElementById('filterTipo').value = '';
    document.getElementById('filterSolicitante').value = '';
    filteredData = allData;
    currentPage = 1;
    renderTable();
}

function removerOrdem(id) {
    const senha = prompt("Digite a senha para remover esta OS:");

    if (senha === null) return;

    fetch(`/remover/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-btn-password': senha
        }
    })
    .then(res => res.json())
    .then(res => {
        if (res.sucesso) {
            alert('OS removida com sucesso!');
            fetchData();
        } else {
            alert(res.mensagem || 'Erro ao remover OS.');
        }
    })
    .catch(err => {
        console.error(err);
        alert('Erro de conexão com o servidor.');
    });
}

function fazerBackup() {
  window.location.href = '/backup';
}

function imprimirOrdem(row) {
  const campos = [
    "ID OS", "Data", "Setor", "Solicitante", "Equipamento", "Motivo", "Recebido por",
    "Nome do Executor", "Tipo de Manutenção", "Descrição do Serviço", "Material Utilizado",
    "Mão de Obra", "Tempo Previsto", "Tempo Utilizado", "Data Final", "Pendência", "Assinatura"
  ];

  const chaves = [
    "id", "data", "setor", "solicitante", "equipamento", "motivo", "recebido",
    "nome", "tipo", "descricao", "material", "mao", "tempo_previsto",
    "tempo_utilizado", "finalizacao", "pendencia", "assinatura"
  ];

  const conteudo = `
  <html>
  <head>
    <title>Impressão da Ordem de Serviço</title>
    <style>
      body {
        font-family: 'Segoe UI', sans-serif;
        margin: 40px;
        background-color: #ffffff;
        color: #1b1b1b;
      }

      .logo {
        text-align: center;
        margin-bottom: 20px;
      }

      .logo img {
        max-width: 140px;
      }

      .titulo {
        text-align: center;
        font-size: 26px;
        font-weight: bold;
        margin-top: 10px;
        color: #2e7d32;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 30px;
        font-size: 15px;
        table-layout: fixed;
        word-wrap: break-word;
      }

      th,
      td {
        padding: 10px 12px;
        border: 1px solid #ccc;
        text-align: left;
        vertical-align: top;
      }

      th {
        background-color: #2e7d32;
        color: #ffffff;
        font-weight: bold;
        width: 30%;
      }

      td {
        background-color: #ffffff;
        color: #000000;
        white-space: pre-wrap;
        word-break: break-word;
      }

      tr:nth-child(even) td {
        background-color: #f1f8e9;
      }

      .assinatura {
        margin-top: 50px;
        display: flex;
        justify-content: space-between;
      }

      .assinatura div {
        width: 45%;
        text-align: center;
      }

      .assinatura hr {
        margin-top: 40px;
        border: none;
        border-top: 1px solid #999;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        th {
          background-color: #2e7d32 !important;
          color: #ffffff !important;
          font-weight: bold !important;
        }

        td {
          background-color: #ffffff !important;
          color: #000000 !important;
        }

        tr:nth-child(even) td {
          background-color: #f1f8e9 !important;
        }
      }
    </style>

  </head>
  <body>
    <div class="logo">
      <img src="settings/Logo.png" alt="Logo da Empresa">
    </div>
    <div class="titulo">Ordem de Serviço - RD</div>
    <table>
      <tbody>
        ${campos.map((label, i) => `
          <tr>
            <th>${label}</th>
            <td>${formatarDataBRIfNeeded(chaves[i], row[chaves[i]]) || ''}</td>
          </tr>`).join('')}
      </tbody>
    </table>

    <div class="assinatura">
      <div>
        <hr>
        <p>Responsável Técnico</p>
      </div>
      <div>
        <hr>
        <p>Solicitante</p>
      </div>
    </div>
  </body>
  </html>
  `;

  const janela = window.open('', '_blank');
  janela.document.write(conteudo);
  janela.document.close();

  janela.onload = function () {
    const logo = janela.document.querySelector("img");
    if (logo && !logo.complete) {
      logo.onload = () => janela.print();
    } else {
      janela.print();
    }
  };
}

function formatarDataBRIfNeeded(campo, valor) {
  if (!valor) return '';
  if (campo === 'data' || campo === 'finalizacao') {
    return formatarDataBR(valor);
  }
  return valor;
}

function formatarDataBR(isoString) {
  if (!isoString || !isoString.includes('-')) return isoString;
  const [ano, mes, dia] = isoString.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}


fetchData();