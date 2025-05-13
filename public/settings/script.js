let currentPage = 1;
const rowsPerPage = 10;
let allData = [], filteredData = [];

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

        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });

        // Adiciona botão de remover
        const actionTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Remover';
        deleteBtn.onclick = () => removerOrdem(row[0]); // ID OS na primeira posição
        actionTd.appendChild(deleteBtn);
        tr.appendChild(actionTd);

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
    const campos = ['data', 'setor', 'solicitante', 'equipamento', 'motivo', 'recebido', 'nome', 'tipo', 'descricao', 'material', 'mao', 'tempoPrevisto', 'tempoUtilizado', 'finalizacao', 'assinatura'];
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
    const setor = document.getElementById('filterSetor').value.toLowerCase();
    const tipo = document.getElementById('filterTipo').value.toLowerCase();
    const solicitante = document.getElementById('filterSolicitante').value.toLowerCase();
    filteredData = allData.filter(row =>
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