let currentPage = 1;
const rowsPerPage = 10;
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

    // Botão de ação (remover)
    const tdAcoes = document.createElement('td');
    const btnRemover = document.createElement('button');
    btnRemover.textContent = 'Remover';
    btnRemover.className = 'btn-acao-remover';
    btnRemover.onclick = () => removerOrdem(row.id);
    tdAcoes.appendChild(btnRemover);
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
    if (!confirm(`Deseja remover a OS de ID ${id}?`)) return;

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


fetchData();