// A5 — Risco 6: Arquitetura 100% front-end. A integridade dos logs no localStorage
// não pode ser forçada tecnicamente contra manipulações diretas via DevTools.
// Essa limitação está mapeada no Relatório Técnico.

const USERS = [
  {
    id: 1,
    name: "Ana Souza",
    email: "aluno@faculdade.local",
    password: "123456",
    role: "ALUNO",
    studentId: "202400001"
  },
  {
    id: 2,
    name: "Prof. Carlos Lima",
    email: "professor@faculdade.local",
    password: "123456",
    role: "PROFESSOR",
    classes: ["5A", "5B"]
  },
  {
    id: 3,
    name: "Administrador Geral",
    email: "admin@faculdade.local",
    password: "admin",
    role: "ADMIN"
  }
];

// Mapeamento de perfil para rótulo legível
const ROLE_LABELS = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  ADMIN: "Administrador"
};

// A2 — Risco 4: mascaramento de CPF para perfis não-ADMIN
// Formato exibido: ***.XXX.XXX-** (grupos centrais visíveis, extremos mascarados)
function maskCpf(cpf) {
  if (!cpf) return "—";
  const match = cpf.match(/^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/);
  if (match) return "***." + match[2] + "." + match[3] + "-**";
  return "***.***.***-**";
}

// A2 — Risco 12: FAKE_API_TOKEN removido do código-fonte.
// Em produção, credenciais seriam gerenciadas no back-end via variável de ambiente.

const STORAGE_KEYS = {
  session: "ocorrencias_sessao",
  occurrences: "ocorrencias_registros",
  audit: "ocorrencias_logs"
};

const INITIAL_OCCURRENCES = [
  {
    id: "OC-1001",
    studentName: "Marina Alves",
    studentId: "202300145",
    studentCpf: "123.456.789-10",
    studentEmail: "marina.alves@email.local",
    studentPhone: "(47) 99999-1010",
    category: "Nota",
    priority: "Média",
    description: "Solicitação de revisão de nota da avaliação bimestral.",
    internalNote: "Verificar com a coordenação antes de responder.",
    status: "Aberta",
    createdBy: "professor@faculdade.local",
    createdAt: "2026-05-05T18:40:00.000Z"
  },
  {
    id: "OC-1002",
    studentName: "Rafael Martins",
    studentId: "202200771",
    studentCpf: "987.654.321-00",
    studentEmail: "rafael.martins@email.local",
    studentPhone: "(47) 98888-2020",
    category: "Frequência",
    priority: "Alta",
    description: "Aluno contesta lançamento de falta em aula prática.",
    internalNote: "Conferir chamada manual.",
    status: "Em análise",
    createdBy: "professor@faculdade.local",
    createdAt: "2026-05-05T18:50:00.000Z"
  },
  {
    id: "OC-1003",
    studentName: "Beatriz Costa",
    studentId: "202100441",
    studentCpf: "111.222.333-44",
    studentEmail: "beatriz.costa@email.local",
    studentPhone: "(47) 97777-3030",
    category: "Solicitação administrativa",
    priority: "Crítica",
    description: "Solicitação envolvendo documentação acadêmica e prazo de matrícula.",
    internalNote: "Priorizar atendimento.",
    status: "Aberta",
    createdBy: "admin@faculdade.local",
    createdAt: "2026-05-05T19:00:00.000Z"
  },
  {
    id: "OC-1004",
    studentName: "Ana Souza",
    studentId: "202400001",
    studentCpf: "444.555.666-77",
    studentEmail: "aluno@faculdade.local",
    studentPhone: "(47) 96666-4040",
    category: "Nota",
    priority: "Média",
    description: "Solicitação de revisão de nota da prova substitutiva.",
    internalNote: "Aguardando retorno da coordenação.",
    status: "Aberta",
    createdBy: "professor@faculdade.local",
    createdAt: "2026-05-06T10:00:00.000Z"
  }
];

const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const occurrenceForm = document.querySelector("#occurrenceForm");
const logoutBtn = document.querySelector("#logoutBtn");
const exportBtn = document.querySelector("#exportBtn");
const clearLogsBtn = document.querySelector("#clearLogsBtn");
const resetBtn = document.querySelector("#resetBtn");
const searchInput = document.querySelector("#search");
const roleLabel = document.querySelector("#roleLabel");

const sessionBadge = document.querySelector("#sessionBadge");
const currentUserName = document.querySelector("#currentUserName");
const currentUserDetails = document.querySelector("#currentUserDetails");
const occurrencesTable = document.querySelector("#occurrencesTable");
const auditLog = document.querySelector("#auditLog");
const totalOccurrences = document.querySelector("#totalOccurrences");
const criticalOccurrences = document.querySelector("#criticalOccurrences");
const lastUpdate = document.querySelector("#lastUpdate");

function boot() {
  if (!localStorage.getItem(STORAGE_KEYS.occurrences)) {
    localStorage.setItem(STORAGE_KEYS.occurrences, JSON.stringify(INITIAL_OCCURRENCES));
  }

  if (!localStorage.getItem(STORAGE_KEYS.audit)) {
    localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify([
      {
        when: new Date().toISOString(),
        user: "sistema",
        action: "BASE_INICIAL_CRIADA",
        detail: "Dados fictícios carregados no localStorage."
      }
    ]));
  }

  const session = getSession();

  if (session) {
    showApp(session);
  } else {
    showLogin();
  }
}

function getOccurrences() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.occurrences) || "[]");
}

function saveOccurrences(occurrences) {
  localStorage.setItem(STORAGE_KEYS.occurrences, JSON.stringify(occurrences));
}

function getAuditLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.audit) || "[]");
}

function saveAuditLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(logs));
}

function getSession() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
}

function saveSession(user) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
}

function writeLog(action, detail) {
  const session = getSession();
  const logs = getAuditLogs();

  logs.unshift({
    when: new Date().toISOString(),
    user: session ? session.email : "anonimo",
    role: session ? session.role : "SEM_SESSAO",
    action,
    detail
  });

  saveAuditLogs(logs);
}

function showLogin() {
  loginView.classList.remove("hidden");
  appView.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  sessionBadge.textContent = "Sessão não iniciada";
  sessionBadge.classList.add("muted");
}

function showApp(user) {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  const roleName = ROLE_LABELS[user.role] || user.role;
  sessionBadge.textContent = `${user.name} — ${roleName}`;
  sessionBadge.classList.remove("muted");

  currentUserName.textContent = user.name;
  currentUserDetails.textContent = user.email;
  if (roleLabel) roleLabel.textContent = `Perfil: ${roleName}`;

  applyRBAC(user.role);
  render();
}

function login(email, password) {
  const user = USERS.find((item) => item.email === email && item.password === password);

  if (!user) {
    alert("Usuário ou senha inválidos.");
    writeLog("LOGIN_FALHOU", `Tentativa para ${email}`);
    return;
  }

  saveSession(user);
  writeLog("LOGIN_OK", `Usuário ${user.email} entrou no sistema.`);
  showApp(user);
}

function logout() {
  const session = getSession();
  writeLog("LOGOUT", session ? `${session.email} saiu do sistema.` : "Sessão encerrada.");
  localStorage.removeItem(STORAGE_KEYS.session);
  showLogin();
}

// RBAC: controla visibilidade de elementos conforme o perfil do usuário logado
function applyRBAC(role) {
  const occurrenceFormCard = document.querySelector("#occurrenceFormCard");

  // Formulário de nova ocorrência: apenas PROFESSOR e ADMIN podem cadastrar
  if (occurrenceFormCard) {
    occurrenceFormCard.classList.toggle("hidden", role === "ALUNO");
  }

  // Exportar dados: apenas ADMIN
  exportBtn.classList.toggle("hidden", role !== "ADMIN");

  // Limpar logs: apenas ADMIN
  clearLogsBtn.classList.toggle("hidden", role !== "ADMIN");
}

function createOccurrence(event) {
  event.preventDefault();

  // A3 — Risco 9: validação de campos obrigatórios
  const studentName = document.querySelector("#studentName").value.trim();
  const studentId = document.querySelector("#studentId").value.trim();
  const description = document.querySelector("#description").value.trim();
  const privacyAck = document.querySelector("#privacyAck").checked;

  if (!studentName || !studentId || !description) {
    alert("Preencha os campos obrigatórios: Nome do aluno, Matrícula e Descrição.");
    return;
  }

  if (!privacyAck) {
    alert("É necessário marcar o consentimento de privacidade para registrar a ocorrência.");
    return;
  }

  // A3 — Risco 9 / A1 — Risco 2: somente PROFESSOR e ADMIN podem criar ocorrências
  const session = getSession();
  if (!session || (session.role !== "PROFESSOR" && session.role !== "ADMIN")) {
    alert("Acesso negado: apenas professores e administradores podem registrar ocorrências.");
    return;
  }

  const occurrence = {
    id: `OC-${Math.floor(Math.random() * 9000) + 1000}`,
    studentName: studentName,
    studentId: studentId,
    studentCpf: document.querySelector("#studentCpf").value.trim(),
    studentEmail: document.querySelector("#studentEmail").value.trim(),
    studentPhone: document.querySelector("#studentPhone").value.trim(),
    category: document.querySelector("#category").value,
    priority: document.querySelector("#priority").value,
    description: description,
    internalNote: document.querySelector("#internalNote").value.trim(),
    privacyAck: document.querySelector("#privacyAck").checked,
    status: "Aberta",
    createdBy: session ? session.email : "desconhecido",
    createdAt: new Date().toISOString()
  };

  const occurrences = getOccurrences();
  occurrences.unshift(occurrence);
  saveOccurrences(occurrences);

  writeLog(
    "OCORRENCIA_CRIADA",
    `Criada ocorrência ${occurrence.id} para ${occurrence.studentName} / ${occurrence.studentCpf}. Descrição: ${occurrence.description}`
  );

  occurrenceForm.reset();
  render();
}

function deleteOccurrence(id) {
  // A1 — Risco 2/3: guard clause — somente ADMIN pode excluir
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    alert("Acesso negado: apenas administradores podem excluir ocorrências.");
    return;
  }

  // A3 — Risco 10: confirmação obrigatória antes de excluir
  if (!confirm("Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.")) {
    return;
  }

  const occurrences = getOccurrences();
  const occurrence = occurrences.find((item) => item.id === id);
  const updated = occurrences.filter((item) => item.id !== id);

  saveOccurrences(updated);
  writeLog("OCORRENCIA_EXCLUIDA", `Ocorrência ${id} excluída. Registro: ${JSON.stringify(occurrence)}`);
  render();
}

function changeStatus(id, status) {
  // A1 — Risco 2/3: guard clause — somente PROFESSOR e ADMIN podem alterar status
  const session = getSession();
  if (!session || (session.role !== "PROFESSOR" && session.role !== "ADMIN")) {
    alert("Acesso negado: apenas professores e administradores podem alterar o status.");
    return;
  }

  const occurrences = getOccurrences();
  const occurrence = occurrences.find((item) => item.id === id);

  if (!occurrence) {
    return;
  }

  occurrence.status = status;
  occurrence.updatedAt = new Date().toISOString();

  saveOccurrences(occurrences);
  writeLog("STATUS_ALTERADO", `Ocorrência ${id} alterada para ${status}.`);
  render();
}

function exportEverything() {
  // A1 — Risco 2/3: guard clause — somente ADMIN pode exportar
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    alert("Acesso negado: apenas administradores podem exportar dados.");
    return;
  }
  // A2 — Risco 5: exportação sanitizada — sem senhas, token ou cópia do localStorage
  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: session ? { name: session.name, email: session.email, role: session.role } : null,
    occurrences: getOccurrences(),
    audit: getAuditLogs()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "backup-completo-ocorrencias.json";
  anchor.click();

  URL.revokeObjectURL(url);

  writeLog("EXPORTACAO_TOTAL", "Usuário exportou todos os dados do sistema.");
}

function clearLogs() {
  // A4 — Risco 7: guard clause — somente ADMIN pode limpar logs
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    alert("Acesso negado: apenas administradores podem limpar os logs.");
    return;
  }

  if (!confirm("Tem certeza que deseja limpar todo o histórico de logs?")) {
    return;
  }

  // A4 — Risco 7: registra a ação de limpeza antes de apagar
  saveAuditLogs([{
    when: new Date().toISOString(),
    user: session.email,
    role: session.role,
    action: "LOGS_LIMPOS",
    detail: `Histórico de logs limpo pelo administrador ${session.name} (${session.email}).`
  }]);
  render();
}

function resetData() {
  localStorage.setItem(STORAGE_KEYS.occurrences, JSON.stringify(INITIAL_OCCURRENCES));
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEYS.session);
  boot();
}

function render() {
  const session = getSession();
  const role = session ? session.role : null;
  const term = searchInput.value.toLowerCase();
  const occurrences = getOccurrences();

  // RBAC: ALUNO só visualiza ocorrências em que é o estudante cadastrado
  let visibleOccurrences = occurrences;
  if (role === "ALUNO" && session) {
    visibleOccurrences = occurrences.filter((item) =>
      item.studentEmail === session.email ||
      item.studentId === session.studentId
    );
  }

  // A5 — Risco 11: busca segura — monta string pesquisável conforme perfil,
  // impedindo que dados ocultos na interface sejam descobertos via campo de busca
  const filtered = visibleOccurrences.filter((item) => {
    const parts = [
      item.id, item.studentName, item.studentId,
      item.studentEmail, item.studentPhone,
      item.category, item.priority, item.status,
      item.description, item.createdBy
    ];
    if (role === "ADMIN") {
      parts.push(item.studentCpf, item.internalNote);
    } else if (role === "PROFESSOR") {
      parts.push(maskCpf(item.studentCpf), item.internalNote);
    } else {
      parts.push(maskCpf(item.studentCpf));
    }
    const searchableContent = parts.join(" ").toLowerCase();
    return searchableContent.includes(term);
  });

  totalOccurrences.textContent = visibleOccurrences.length;
  criticalOccurrences.textContent = visibleOccurrences.filter((item) => item.priority === "Crítica").length;
  lastUpdate.textContent = `Atualizado em ${new Date().toLocaleTimeString("pt-BR")}`;

  occurrencesTable.innerHTML = filtered.map((item) => {
    // Botões de ação conforme perfil (RBAC)
    const canChangeStatus = role === "PROFESSOR" || role === "ADMIN";
    const canDelete = role === "ADMIN";

    const actionButtons = [];
    if (canChangeStatus) {
      actionButtons.push(`<button class="btn secondary" onclick="changeStatus('${item.id}', 'Em análise')">Em análise</button>`);
      actionButtons.push(`<button class="btn secondary" onclick="changeStatus('${item.id}', 'Resolvida')">Resolver</button>`);
    }
    if (canDelete) {
      actionButtons.push(`<button class="btn danger" onclick="deleteOccurrence('${item.id}')">Excluir</button>`);
    }

    // A2 — Risco 4: CPF mascarado para não-ADMIN
    const cpfDisplay = (role === "ADMIN") ? item.studentCpf : maskCpf(item.studentCpf);

    // A2 — Risco 4: Obs. interna oculta para ALUNO
    const internalNoteHtml = (role !== "ALUNO" && item.internalNote)
      ? "<br /><strong>Obs. interna:</strong> " + item.internalNote
      : "";

    return `
    <tr>
      <td>
        <strong>${item.studentName}</strong><br />
        <span class="muted-text">${item.studentId}</span>
      </td>
      <td>${cpfDisplay}</td>
      <td>
        ${item.studentEmail}<br />
        ${item.studentPhone}
      </td>
      <td>${item.category}</td>
      <td><span class="priority ${item.priority}">${item.priority}</span></td>
      <td>${item.status}</td>
      <td>
        <strong>Descrição:</strong> ${item.description}${internalNoteHtml}
      </td>
      <td>
        <div class="row-actions">
          ${actionButtons.join("")}
          ${actionButtons.length === 0 ? '<span class="muted-text">Somente leitura</span>' : ""}
        </div>
      </td>
    </tr>`;
  }).join("");

  const logs = getAuditLogs();

  if (logs.length === 0) {
    auditLog.innerHTML = `<div class="notice">Nenhum log registrado.</div>`;
  } else {
    auditLog.innerHTML = logs.map((log) => `
      <div class="log-item">
        <strong>${log.when}</strong><br />
        usuário=${log.user || "—"} | perfil=${log.role || "—"} | ação=${log.action}<br />
        detalhe=${log.detail}
      </div>
    `).join("");
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  login(
    document.querySelector("#email").value,
    document.querySelector("#password").value
  );
});

occurrenceForm.addEventListener("submit", createOccurrence);
logoutBtn.addEventListener("click", logout);
exportBtn.addEventListener("click", exportEverything);
clearLogsBtn.addEventListener("click", clearLogs);
resetBtn.addEventListener("click", resetData);
searchInput.addEventListener("input", render);

window.deleteOccurrence = deleteOccurrence;
window.changeStatus = changeStatus;

// A4 — Risco 8: timeout de sessão por inatividade (15 min)
const SESSION_TIMEOUT_MS = 900000;
let sessionTimer = null;

function resetSessionTimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (!getSession()) return;
  sessionTimer = setTimeout(function () {
    alert("Sessão expirada por inatividade. Faça login novamente.");
    logout();
  }, SESSION_TIMEOUT_MS);
}

["mousemove", "keydown", "click"].forEach(function (evt) {
  window.addEventListener(evt, resetSessionTimer);
});

boot();
resetSessionTimer();
