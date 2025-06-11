let currentPage = 1;
const rowsPerPage = 20;
const senhaRemocao = '!@#321!';
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
      'finalizacao', 'assinatura'
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

    tr.appendChild(tdAcoes);
    tableBody.appendChild(tr);
  });

  document.getElementById('page-indicator').textContent =
    `Página ${currentPage} de ${Math.ceil(filteredData.length / rowsPerPage)}`;
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
    const campos = ['data', 'setor', 'solicitante', 'equipamento', 'motivo', 'recebido', 'nome', 'tipo', 'descricao', 'material', 'mao', 'tempo_previsto', 'tempo_utilizado', 'finalizacao', 'assinatura'];
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

    if (senha === null) return; // Usuário cancelou
    if (senha !== senhaRemocao) {
        alert("Senha incorreta. A OS não será removida.");
        return;
    }

    if (!confirm(`Deseja realmente remover a OS de ID ${id}?`)) return;

    fetch(`/remover/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(res => {
            if (res.sucesso) {
                alert('OS removida com sucesso!');
                fetchData();
            } else {
                alert('Erro ao remover OS.');
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
        "Mão de Obra", "Tempo Previsto", "Tempo Utilizado", "Data Final", "Assinatura"
    ];

    let conteudo = `
    <html>
    <head>
      <title>Impressão da Ordem de Serviço</title>
      <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', sans-serif;
            margin: 40px;
            background-color: #ffffff;
            color: #2c3e50;
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
            color: #2c3e50;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            font-size: 15px;
            table-layout: fixed; /* 🚨 Adicionado para forçar quebra de texto */
            word-wrap: break-word; /* Garante quebra dentro das células */
        }

        th, td {
            padding: 10px 12px;
            border: 1px solid #ccc;
            text-align: left;
            vertical-align: top;
        }

        th {
            background-color: #2c3e50;
            color: white;
            font-weight: 600;
            width: 30%;
        }

        tr:nth-child(even) td {
            background-color: #f7f9fc;
        }

        td {
            white-space: pre-wrap; /* ✅ Quebra linhas e preserva \n ou espaços */
            word-break: break-word; /* ✅ Evita overflow horizontal */
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
                -webkit-print-color-adjust: exact !important; /* Safari/Chrome */
                print-color-adjust: exact !important;         /* Firefox/Edge */
            }

            th {
                background-color: #2c3e50 !important;
                color: white !important;
            }

            tr:nth-child(even) td {
                background-color: #f7f9fc !important;
            }

            td {
                background-color: white !important;
                color: #2c3e50 !important;
            }
        }

        </style>
    </head>
    <body>
      <div class="logo">
        <img src="settings/Logo.png" alt="Logo da Empresa">
      </div>
      <h2>Ordem de Serviço - RD</h2>
      <table>
        <tbody>
          ${campos.map((campo, i) => `
            <tr>
              <th>${campo}</th>
              <td>${formatarDataBRIfNeeded(i, row[i])}</td>
            </tr>`).join('')}
        </tbody>
      </table>
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

function formatarDataBRIfNeeded(index, valor) {
    // Campos 1 (data) e 14 (finalizacao) precisam de formatação
    if (index === 1 || index === 14) {
        return formatarDataBR(valor);
    }
    return valor;
}

fetchData();