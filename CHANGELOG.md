# Registro de alterações

## [0.1.0] - 2026-09-07

### Alterado

- Projeto migrado de Python para TypeScript (Node >= 20). Registro de agentes passa de `uvx` para `npx -y mcp-compras-publicas-br@<versão>`. Sem mudança de comportamento, ferramentas ou envelope.

## [Não lançado]

### Adicionado

- Servidor MCP inicial somente leitura do Compras.gov.br/PNCP.
- Pacote npm com suporte a `npx`, incluindo comandos documentados de instalação, atualização e desinstalação.
- Dez adaptadores de agentes.
- Skills em pt-BR para trabalhar com o servidor.
- Snapshots versionados do OpenAPI.
- Manifesto do projeto.
- gate obrigatório de cobertura.
- Detecção de divergências.
- Ferramenta composta `pncp_buscar_contratacao_por_numero_ano_uasg`: localiza CNPJ, ano e sequencial PNCP a partir do número da contratação, ano e UASG.
- Ferramenta composta `pncp_listar_documentos_contratacao_por_numero_ano_uasg`: lista ETP, TR, Edital e anexos de uma contratação por número, ano e UASG, com filtro opcional por tipo de documento.
- Ferramenta composta `pncp_listar_arps_contratacao_por_numero_ano_uasg`: lista as Atas de Registro de Preços de uma contratação por número, ano e UASG.

### Removido

- Removido do projeto o empacotamento obsoleto do Docker e do Docker Compose.

### Testes

- Os testes smoke/sondas smoke da API em produção continuam dependentes do ambiente e do serviço; não há garantia de que passarão em todas as execuções.
