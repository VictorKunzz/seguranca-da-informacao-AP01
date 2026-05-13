# Sistema de Ocorrências Acadêmicas — Refatoração de Segurança

> **⚠️ AVISO IMPORTANTE: NÃO UTILIZE EM PRODUÇÃO**  
> Este sistema é um protótipo estritamente didático e **não deve ser utilizado com dados reais**. Da forma como foi concebido, e apesar das mitigações aplicadas na camada de apresentação (Front-end), a arquitetura carece de servidor isolado e possui vulnerabilidades estruturais críticas (como persistência local manipulável e autenticação falsa) que tornam o seu uso produtivo altamente inseguro. As vulnerabilidades e limitações remanescentes estão detalhadas no **Item 5** deste documento.

**Disciplina:** Segurança da Informação (5º Semestre - Engenharia de Software)  
**Autor:** Victor Henrique Kunz de Souza  
**Instituição:** Católica SC - Joinville  
**Acesso ao Sistema:** [https://victorkunzz.github.io/seguranca-da-informacao-AP01/](https://victorkunzz.github.io/seguranca-da-informacao-AP01/)

---

## 1. Sobre o Projeto

Este repositório é um *fork* de um protótipo didático de sistema de ocorrências acadêmicas. O projeto original foi fornecido com diversas vulnerabilidades de segurança estruturais e arquiteturais propositais no código-fonte (front-end).

O objetivo desta atividade acadêmica foi analisar a arquitetura existente, identificar os riscos de segurança de acordo com as boas práticas de mercado (Tríade CID, LGPD e Princípio do Menor Privilégio) e implementar controles de mitigação diretamente no código (HTML, CSS e JavaScript puro), simulando as defesas possíveis em uma aplicação que atua exclusivamente na camada cliente.

---

## 2. Estrutura de Arquivos

O projeto não utiliza frameworks externos ou back-end, operando inteiramente no navegador do usuário:

```text
seguranca-da-informacao-AP01/
├── index.html       (Estrutura da interface, formulários e views)
├── style.css        (Estilização, layout e responsividade)
├── app.js           (Lógica de negócio, simulação de banco local e RBAC)
├── README.md        (Documentação de segurança e escopo do projeto)
└── LICENSE          (Licença do repositório)
```

---

## 3. Matriz de Riscos e Controles Implementados

Durante a análise técnica do sistema original, mapeamos 12 riscos críticos de segurança. Abaixo está o escopo do que foi identificado e como as vulnerabilidades foram mitigadas através da refatoração do código:

| # | Risco Identificado no Sistema Original | Mitigação / Controle Implementado no Código |
|---|------------------------------------------|---------------------------------------------|
| **1** | Senhas em texto puro no código e na tela de login | Remoção das senhas do HTML; ofuscação com Base64 no array `USERS`; comparação via `btoa()` no login. |
| **2** | Sem diferenciação de permissões entre perfis | Implementação de RBAC via `applyRBAC()` e *Guard Clauses* em todas as funções de negócio críticas. |
| **3** | Seletor de perfil permite troca livre de *role* | Remoção do seletor de perfil; *role* definida exclusivamente pela sessão autenticada; bloqueio via Console. |
| **4** | CPF exibido sem mascaramento para todos | Função `maskCpf()` criada para exibir no formato `***.XXX.XXX-**` para não-ADMIN; Observação Interna restrita. |
| **5** | Exportação de dados massiva vulnerável | Exportação sanitizada no JS: payload contém apenas ocorrências e logs, expurgando senhas, credenciais e usuários. |
| **6** | Logs no localStorage, editáveis pelo usuário | *Risco arquitetural assumido.* Depende de infraestrutura back-end real para garantir integridade. |
| **7** | Botão "Limpar logs" sem restrição/confirmação | Inserção de *Guard Clause* (somente ADMIN) + confirmação obrigatória + geração de registro de auditoria inalterável após a limpeza. |
| **8** | Sessão sem expiração no localStorage | Criação de timeout de inatividade (15 minutos) com reset por interação; limpeza forçada do DOM de login no `logout()`. |
| **9** | Formulário sem validação de campos obrigatórios | Validação de Nome, Matrícula e Descrição via `.trim()`; exigência de checkbox de consentimento de privacidade. |
| **10** | Exclusão de registros sem restrição de perfil | Restrição à *role* ADMIN e exigência de aviso de confirmação antes de remover do banco local. |
| **11** | Busca expõe CPF e dados ocultos (*Data Leakage*) | Construção de uma string de busca segura em memória por perfil, impedindo a pesquisa de campos ocultos na interface. |
| **12** | Tokens de API expostos no código-fonte | Constante com a chave (`FAKE_API_TOKEN`) removida do repositório front-end. |

---

## 4. Justificativa Técnica das Decisões (Relatório de Segurança)

### 4.1. Controle de Acesso e Princípio do Menor Privilégio
A implementação do RBAC (*Role-Based Access Control*) simulado foi a medida estruturante do sistema. O **Princípio do Menor Privilégio** determina que cada usuário deve ter acesso apenas aos recursos estritamente necessários para exercer sua função. No sistema original, todos os perfis tinham acesso irrestrito a todas as funcionalidades.

A correção foi aplicada em duas camadas complementares:
1. **Camada de Interface:** A função `applyRBAC(role)` oculta elementos HTML conforme o perfil logado (ex: o botão de exportação e a seção de auditoria são ocultados para alunos).
2. **Camada Lógica:** *Guard Clauses* foram inseridas no topo de cada função crítica (`deleteOccurrence`, `exportEverything`, `createOccurrence`), garantindo que mesmo que um usuário mal-intencionado force a execução via Console do navegador, o sistema valide a autorização da sessão e bloqueie a tentativa.

### 4.2. Proteção de Dados Pessoais e LGPD
A Lei Geral de Proteção de Dados (LGPD) classifica o CPF como dado pessoal e exige princípios de necessidade e adequação. A criação do método `maskCpf()` preserva apenas os dígitos centrais para identificação parcial. Além disso, o campo de Observação Interna foi ocultado da renderização do perfil ALUNO. Essa decisão atende ao pilar da **Confidencialidade** da Tríade CID, garantindo que dados sensíveis sejam acessíveis apenas a quem tem necessidade legítima.

### 4.3. Busca Segura e Prevenção de Data Leakage
A vulnerabilidade mais crítica do protótipo estava na função de busca, que utilizava `JSON.stringify(item)` para pesquisar os termos. Isso criava um vazamento por canal lateral (*Data Leakage*), pois permitia que um aluno "adivinhasse" dados ocultos (como um CPF ou uma anotação privada do professor) digitando na busca. O código foi reescrito para montar uma *string pesquisável* filtrada dinamicamente com base nas permissões de cada perfil.

### 4.4. Sessão e Proteção de Credenciais
O **Timeout de Sessão por Inatividade (15min)** protege sessões autenticadas contra sequestro em terminais compartilhados. Quando esgotado, o `logout()` é invocado e os campos do formulário são apagados do DOM para impedir retenção de credenciais. 
A ofuscação de senhas com *Base64* (`btoa/atob`) atua como mitigação primária para esconder dados em texto puro no repositório. Ressalta-se, porém, que o Base64 é reversível e, em produção, exigiria criptografia e algoritmos de Hash fortes (como bcrypt) geridos pelo back-end.

### 4.5. Integridade dos Dados e Validação
A validação de campos obrigatórios com `.trim()` protege o sistema contra entradas vazias. O checkbox de consentimento de privacidade atende aos preceitos da LGPD. Além disso, a obrigatoriedade de aceite em confirmações visuais (`confirm()`) em ações destrutivas (ex: exclusões) reforça a **Disponibilidade** dos dados contra erros operacionais acidentais.

---

## 5. Limitações da Solução Entregue e Vulnerabilidades Residuais

As medidas descritas ao longo deste documento representam mitigações possíveis na camada de apresentação (*Client-side*), mas não configuram soluções de segurança definitivas para ambientes de produção. Uma arquitetura *Front-end only* impõe limites intransponíveis que exigem uma infraestrutura de *Back-end* e Banco de Dados para serem superados.

As principais vulnerabilidades não resolvidas pelo escopo restrito deste projeto incluem:

1. **Autenticação Insegura (Codificação Reversível):** O sistema não possui autenticação real. As credenciais de usuário armazenadas no array interno são apenas ofuscadas em *Base64*, uma codificação trivialmente reversível via função `atob()` no console. A adoção de Hashing seguro (bcrypt/Argon2) é impossível no *Client-side*, pois requer processamento e persistência isolada no servidor.
2. **Sessão Vulnerável e XSS:** Como o controle de sessão e os dados de aplicação residem no `localStorage`, qualquer script executado na página (vulnerabilidade a XSS) ou o próprio usuário via DevTools (F12) tem acesso irrestrito aos dados, podendo lê-los ou forjá-los livremente. Um cenário seguro exige a emissão de tokens protegidos em cookies *HttpOnly*.
3. **Quebra de Integridade na Auditoria (Risco 6):** Os logs de rastreabilidade gravados diretamente na máquina do usuário não possuem imutabilidade. Eles podem ser apagados ou adulterados pontualmente, sem deixar rastro, quebrando o pilar de integridade fundamental para qualquer sistema de auditoria confiável.
4. **RBAC Totalmente Contornável:** O Controle de Acesso Baseado em Perfis (RBAC) é validado apenas pelo JavaScript local da máquina do usuário. Apesar das *Guard Clauses* barrarem usuários leigos, um usuário com conhecimentos de programação pode modificar as variáveis de sessão em tempo de execução para contornar restrições, já que não há um servidor interceptando e validando ativamente os privilégios a cada requisição HTTP.
5. **Falta de Criptografia em Repouso:** Dados pessoais acadêmicos requerem armazenamento persistente criptografado em banco de dados isolado. Tais propriedades são impossíveis de garantir via navegador, configurando risco de não-conformidade severa com a LGPD caso este software operasse comercialmente.
