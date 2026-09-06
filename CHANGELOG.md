# Registro de alterações

## [Não lançado]

### Adicionado

- Servidor MCP inicial somente leitura do Compras.gov.br/PNCP.
- Pacote PyPI com suporte a `uvx`, incluindo comandos documentados de instalação, atualização e desinstalação.
- Dez adaptadores de agentes.
- Skills em pt-BR para trabalhar com o servidor.
- Snapshots versionados do OpenAPI.
- Manifesto do projeto.
- gate obrigatório de cobertura.
- Detecção de divergências.

### Removido

- Removido do projeto o empacotamento obsoleto do Docker e do Docker Compose.

### Testes

- Os testes smoke/sondas smoke da API em produção continuam dependentes do ambiente e do serviço; não há garantia de que passarão em todas as execuções.
