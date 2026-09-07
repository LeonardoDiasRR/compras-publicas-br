# Contribuição

## Adicionando um Novo Adaptador de Agente

Todo agente suportado deve ter um ID de agente estável e exclusivo, registrado
no registro de plugins e aceito pela CLI. Uma contribuição que adicione um novo
adaptador também deve:

1. Resolva o destino de configuração do agente para os escopos `project` e
   `user`. Os destinos de projeto devem seguir as regras da raiz do repositório;
   os destinos de usuário devem usar o local global de configuração documentado
   pela plataforma.
2. Defina os caminhos de configuração e a serialização para Windows, Linux e
   macOS. Não detecte o agente implicitamente nem aceite caminhos arbitrários na
   entrada.
3. Adicione fixtures para as configurações de projeto e usuário, incluindo
   configurações não relacionadas existentes que devem sobreviver a uma
   instalação ou atualização.
4. Adicione a skill gerenciada em português do Brasil (`pt-BR`) com o marcador
   de propriedade do pacote. A skill deve preservar o comportamento somente
   leitura do servidor, a proveniência e as orientações de tratamento de erros.
5. Adicione testes de merge que cubram inserção, atualizações idempotentes,
   preservação de configurações não relacionadas, conflitos com entradas não
   gerenciadas e remoção segura.
6. Adicione ou atualize a documentação do agente com seu ID, escopos
   suportados, locais de configuração, exemplos de instalação/atualização/
   desinstalação e limitações.
7. Valide o adaptador e suas fixtures no Windows, Linux e macOS. Os testes
   devem usar fixtures controladas ou subprocessos isolados e não devem exigir
   uma instalação do agente nem acesso à API de origem em tempo real.

## Configuração Local e Verificações

Requisitos: Node.js `>= 20` e npm. Instale as dependências com o lockfile
travado a partir da raiz do repositório:

```bash
npm install
```

Execute a suíte de testes offline e as verificações estáticas antes de enviar
uma alteração:

```bash
npx vitest run
npm run typecheck
npm run build
```

A suíte offline não deve contatar APIs de produção. As sondagens live continuam
opt-in e não fazem parte do gate de contribuição:

```bash
RUN_LIVE_TESTS=1 npx vitest run
```

## Adicionando um Novo Endpoint da API de Origem

Todo novo endpoint deve seguir este fluxo de trabalho. A especificação oficial da
API de origem é a fonte de verdade; wrappers, scrapers, clientes de terceiros,
blogs e servidores MCP existentes não são contratos.

1. **Descubra a especificação oficial.** Confirme o endpoint na documentação
   documentação oficial atual do Compras.gov.br ou PNCP, em formato OpenAPI.
   Verifique o método HTTP, o caminho, os parâmetros, os requisitos de segurança,
   o schema de resposta e a URL base da API de origem.
2. **Crie um snapshot imutável.** Salve a especificação oficial não modificada
   em `specs/upstream/<provider>/<YYYY-MM-DD>.json`. Registre ou atualize a
   referência do snapshot e a versão da especificação OpenAPI em
   `coverage/endpoints.yaml`.
3. **Classifique o endpoint.** Adicione o endpoint ao catálogo e classifique-o
   explicitamente. Somente um `GET` público, útil e operacional pertence ao
   denominador da cobertura implementada. Registre um motivo de exclusão
   documentado para endpoints autenticados, não-GET, obsoletos, inutilizáveis
   ou fora do escopo do projeto.
4. **Escreva o nome e a descrição em português.** Dê ao endpoint um nome de
   ferramenta estável e claro em português e uma descrição em português baseada
   na semântica oficial. Os nomes das ferramentas devem ser exclusivos, ter o
   provider como prefixo, corresponder a `^(compras|pncp)_[a-z0-9_]+$` e ter no
   máximo 128 caracteres. Não exponha um `operationId` opaco como nome voltado
   ao usuário nem invente comportamento que não esteja presente no contrato
   oficial.
5. **Implemente o adaptador do provedor.** Adicione ou atualize o adaptador do
   provedor apropriado para que ele use a URL base fixa da API de origem, preserve
   o caminho oficial e a semântica dos parâmetros e adapte apenas detalhes de
   transporte ou paginação específicos do provedor.
6. **Implemente o caminho do serviço.** Encaminhe a operação pelo serviço de
   consulta compartilhado para validação de parâmetros, execução, proveniência
   e respostas normalizadas. Não duplique a política HTTP nem a lógica de
   execução do endpoint na ferramenta.
7. **Registre a ferramenta MCP.** Adicione o registro da ferramenta somente
   leitura em uma relação um-para-um usando a entrada do manifest, o nome em
   português, a descrição em português e os parâmetros validados.
8. **Adicione o teste de contrato.** Teste o contrato do adaptador, do serviço
   e da ferramenta com o formato da resposta da API de origem e o comportamento
   de erros. Verifique o método, a URL base fixa, o caminho, os parâmetros, o
   envelope de resposta e a proveniência relevante. Não dependa da produção
   live para a suíte de testes normal.
9. **Atualize o manifest.** Defina a classificação do endpoint, o status de
   implementação, o nome da ferramenta, a descrição em português, os
   parâmetros, o contrato de resposta e a referência do snapshot em
   `coverage/endpoints.yaml`. Mantenha o manifest e a implementação em uma
   relação um-para-um.
 10. **Regenere a documentação.** Regenere os documentos de ferramentas e de
     cobertura derivados do manifest:
     ```bash
     npm run catalogo -- render-tools coverage/endpoints.yaml --output TOOLS.md
     npm run catalogo -- render-coverage coverage/endpoints.yaml --output ENDPOINT_COVERAGE.md
     ```
     Verifique os dois documentos gerados:
     ```bash
     npm run catalogo -- --check-tools TOOLS.md coverage/endpoints.yaml
     npm run catalogo -- --check-coverage-doc ENDPOINT_COVERAGE.md coverage/endpoints.yaml
     ```
 11. **Restaure a cobertura para 100%.** Execute todas as verificações:
     ```bash
     npm run typecheck
     npx vitest run
     npm run catalogo -- check coverage/endpoints.yaml
     rg -n '\.(post|put|patch|delete)\(' src/shared/http_readonly.ts src/features/provedores
     npm run build
     ```
     A varredura somente leitura não deve produzir correspondências. Um novo
     `GET` público e útil deve ser implementado ou classificado explicitamente
     com uma exclusão documentada. Não considere o endpoint concluído enquanto
     o gate de cobertura reportar qualquer valor abaixo de `100%`.

## Limites Inegociáveis

- O MCP é estritamente somente leitura. Nunca adicione ou exponha operações
  `POST`, `PUT`, `PATCH` ou `DELETE`.
- Nunca aceite URLs, hosts ou URLs base arbitrários da API de origem na entrada
  da ferramenta. As origens dos provedores são fixadas nos adaptadores dos
  provedores e impostas pelo cliente HTTP compartilhado.
- Nunca faça commit, incorpore, transmita ou registre secrets, credenciais,
  chaves de API, tokens, cookies ou outro material de autenticação. Não exponha
  endpoints autenticados como ferramentas públicas.
- Nunca contorne as proteções de caminho relativo e traversal nem passe
  parâmetros de caminho ou de consulta não documentados por fora da validação
  do catálogo.
- Nunca oculte erros da API de origem. Preserve o status da API de origem, os
  detalhes do erro e a proveniência no erro normalizado; não substitua falhas por
  um resultado vazio, um sucesso fabricado ou uma mensagem de sucesso genérica.
- Não contorne o catálogo, o serviço de consulta compartilhado, o adaptador do
  provedor ou os testes de contrato para uma implementação rápida.

## Checklist de Conclusão

- [ ] Especificação oficial localizada e verificada.
- [ ] Snapshot datado e não modificado armazenado e referenciado.
- [ ] Endpoint classificado com uma justificativa explícita.
- [ ] Nome e descrição da ferramenta em português adicionados.
- [ ] Adaptador do provedor e caminho do serviço compartilhado implementados.
- [ ] Ferramenta MCP somente leitura registrada.
- [ ] Testes de contrato cobrem o sucesso e o comportamento de erros da API de
  origem.
- [ ] `coverage/endpoints.yaml` atualizado.
- [ ] `TOOLS.md` e `ENDPOINT_COVERAGE.md` regenerados e verificados.
- [ ] Todas as verificações passam com a cobertura em `100%`.
