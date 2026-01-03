// === ELEMENTOS DO FORMULÁRIO ===
const veiculosDiv = document.getElementById("veiculos");
const btnAdicionar = document.getElementById("adicionarVeiculo");
const form = document.getElementById("formMorador");
const listaMoradores = document.getElementById("listaMoradores");
const fotoInput = document.getElementById("foto");
const previewFoto = document.getElementById("previewFoto");
const btnAbrirCadastro = document.getElementById("btnAbrirCadastro");
const btnAbrirLista = document.getElementById("btnAbrirLista");

// Campos do formulário
const nome = document.getElementById("nome");
const unidade = document.getElementById("unidade");
const ocupacao = document.getElementById("ocupacao");
const documentos = document.getElementById("documentos");
const tipoDocumento = document.getElementById("tipoDocumento");
const telefones = document.getElementById("telefones");
const email = document.getElementById("email");
const mensagem = document.getElementById("mensagem");

let db;
let fotoBase64 = "";

// === FOTO ===
fotoInput.addEventListener("change", () => {
    const file = fotoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        fotoBase64 = reader.result;
        previewFoto.src = fotoBase64;
        previewFoto.style.display = "block";
    };
    reader.readAsDataURL(file);
});

// === BANCO DE DADOS ===
const request = indexedDB.open("condominioDB", 1);

request.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("moradores")) {
        db.createObjectStore("moradores", { keyPath: "id", autoIncrement: true });
        console.log("Object store 'moradores' criada");
    }
};

request.onsuccess = e => {
    db = e.target.result;
    console.log("Banco carregado com sucesso");

    // Cria o primeiro veículo automaticamente
    veiculosDiv.innerHTML = "";
    criarVeiculo();

    // Associa o submit do formulário
    form.addEventListener("submit", salvarMorador);

    // Lista os moradores existentes
    listarMoradores();
};

request.onerror = () => {
    console.error("Erro ao abrir o banco de dados");
    alert("Erro ao abrir o banco de dados. Veja o console para detalhes.");
};

// === ABRIR / FECHAR FORMULÁRIO ===
btnAbrirCadastro.addEventListener("click", () => {
    form.style.display = form.style.display === "block" ? "none" : "block";
    form.scrollIntoView({ behavior: "smooth" });
});

// === ABRIR / FECHAR LISTA ===
btnAbrirLista.addEventListener("click", () => {
    listaMoradores.style.display = listaMoradores.style.display === "block" ? "none" : "block";
    listarMoradores();
    listaMoradores.scrollIntoView({ behavior: "smooth" });
});

// === VEÍCULO ===
function criarVeiculo() {
    const div = document.createElement("div");
    div.classList.add("veiculo");

    div.innerHTML = `
        <div class="linha">
            <div class="grupo">
                <label>Placa</label>
                <input class="placa" required>
            </div>
            <div class="grupo">
                <label>Modelo</label>
                <input class="modelo" required>
            </div>
        </div>
        <button type="button" class="remover-veiculo">Remover veículo</button>
    `;

    div.querySelector(".remover-veiculo").onclick = () => div.remove();
    veiculosDiv.appendChild(div);
}

btnAdicionar.onclick = criarVeiculo;

// === SALVAR MORADOR ===
function salvarMorador(e) {
    e.preventDefault();

    if (!db) {
        alert("Banco de dados ainda não carregou. Recarregue a página.");
        return;
    }

    // Validação rápida
    if (!nome.value || !unidade.value || !ocupacao.value || !documentos.value) {
        alert("Preencha todos os campos obrigatórios!");
        return;
    }

    // Pegando os veículos
    const veiculos = [...document.querySelectorAll(".veiculo")].map(v => ({
        placa: v.querySelector(".placa").value,
        modelo: v.querySelector(".modelo").value
    }));

    const morador = {
        nome: nome.value,
        unidade: unidade.value,
        ocupacao: ocupacao.value,
        documento: documentos.value,
        tipoDocumento: tipoDocumento.value,
        telefone: telefones.value,
        email: email.value,
        mensagem: mensagem.value,
        foto: fotoBase64,
        veiculos
    };

    const tx = db.transaction("moradores", "readwrite");
    const store = tx.objectStore("moradores");
    const requestAdd = store.add(morador);

    requestAdd.onsuccess = () => {
        console.log("Morador salvo:", morador);
    };

    tx.oncomplete = () => {
        alert("Morador salvo com sucesso!");
        form.reset();
        fotoBase64 = "";
        previewFoto.style.display = "none";
        veiculosDiv.innerHTML = "";
        criarVeiculo();
        form.style.display = "none";
        listarMoradores();
    };

    tx.onerror = e => {
        console.error("Erro ao salvar morador:", e.target.error);
        alert("Erro ao salvar morador. Veja o console.");
    };
}

// === LISTAR MORADORES ===
function listarMoradores() {
    if (!db) return;

    listaMoradores.innerHTML = "";

    const tx = db.transaction("moradores", "readonly");
    const store = tx.objectStore("moradores");

    store.openCursor().onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
            const m = cursor.value;

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                ${m.foto ? `<img src="${m.foto}" style="width:70px;height:70px;border-radius:50%; margin-bottom:5px">` : ""}
                <strong>${m.nome}</strong><br>
                Unidade: ${m.unidade} <br>
                Ocupação: ${m.ocupacao}
                <ul>
                    ${m.veiculos.map(v => `<li>${v.placa} - ${v.modelo}</li>`).join("")}
                </ul>
            `;

            listaMoradores.appendChild(card);
            cursor.continue();
        }
    };
}
