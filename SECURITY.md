# Política de Segurança

Este projeto fornece um servidor MCP somente para leitura para APIs públicas de
compras governamentais brasileiras. Este documento descreve as garantias de
segurança no código e os controles necessários quando o servidor é implantado
remotamente.

## Garantia de Somente Leitura

- Os adaptadores upstream podem emitir apenas requisições `GET`. Eles não
  expõem os métodos `POST`, `PUT`, `PATCH` ou `DELETE`.
- O serviço de consulta rejeita operações do catálogo cujo método não seja
  `GET`.
- O pipeline de CI verifica o cliente HTTP e os adaptadores de provedores em
  busca de métodos de mutação.
- As ferramentas MCP consultam e retornam dados; elas não criam, atualizam ou
  excluem registros upstream.

## Limite de Rede Upstream

A origem upstream é fixa e deve usar HTTPS na porta padrão. A allowlist de
produção é:

- `https://dadosabertos.compras.gov.br`
- `https://pncp.gov.br` (incluindo o path base `/api/pncp` configurado)

O cliente HTTP rejeita credenciais incorporadas em uma URL base, portas não
suportadas, strings de consulta e fragmentos. As ferramentas não podem receber
uma URL arbitrária, portanto a entrada do usuário não pode selecionar uma
origem upstream diferente.

## Proteção de Caminhos e Travessia

Apenas paths relativos à origem são aceitos. O cliente rejeita:

- URLs absolutas e URLs relativas ao protocolo;
- esquemas, hosts, strings de consulta ou fragmentos no argumento de path;
- barras invertidas;
- segmentos de path `..`, incluindo formas codificadas em porcentagem ou
  codificadas repetidamente.

Os parâmetros de path são validados em relação ao catálogo de endpoints e
codificados em URL antes de serem renderizados. Os parâmetros de consulta
também são limitados aos parâmetros declarados pelo catálogo e validados em
relação aos seus esquemas declarados.

## Controles do Instalador de Plugins

O instalador de plugins aceita apenas um adaptador de agente compatível e o
escopo `project` ou `user`. Os destinos do projeto permanecem abaixo da raiz do
projeto detectada, e os destinos do usuário permanecem abaixo do diretório
home do usuário; paths de destino arbitrários não são aceitos.

O instalador rejeita segmentos de travessia e qualquer destino resolvido fora do
escopo selecionado. Ele mescla apenas a entrada `compras-publicas-br`, preserva
as demais configurações e nunca sobrescreve uma entrada não reconhecida ou uma
skill não gerenciada. As alterações de configuração e de skills são gravadas
atomicamente.

As entradas de configuração genéricas `.agent` carregam o marcador exato de
metadados de pacote e esquema `managedBy: {package: mcp-compras-publicas-br, schemaVersion: 1}`.
Os adaptadores nativos reconhecem a propriedade somente por meio do formato
nativo exato documentado para a entrada e do comando fixado. Eles não adicionam
nem aceitam `managedBy` ou qualquer outro campo desconhecido em formatos não
genéricos. Isso inclui o Hermes Agent, cujo destino fixo de compatibilidade é
`.hermes/config.json5`; sua entrada nativa deve corresponder ao formato JSON5
documentado e ao pin estável exato
`mcp-compras-publicas-br@<version>`. As skills gerenciadas devem carregar o
marcador `managed-by: mcp-compras-publicas-br; format: 1`. As operações de
instalação, atualização e desinstalação atuam sobre dados existentes somente
quando o marcador ou a assinatura nativa aplicável e o formato esperado da
entrada confirmam a propriedade.

Configuração é tratada como dado. O instalador nunca executa comandos,
argumentos, hooks ou outros valores lidos de uma configuração existente; ele
emite apenas dois comandos fixos para este pacote: o pin
`npx -y mcp-compras-publicas-br@<version>` com versão estável exata, ou —
quando a versão pinada é a instalação local em execução e o bin existe —
`node <caminho absoluto do bin do pacote>`. Nenhum outro comando é emitido.

A saída e os logs do instalador não devem conter conteúdo de configuração,
credenciais, tokens ou outros segredos. Paths e avisos devem ser limitados às
informações operacionais necessárias para relatar o resultado.

## Credenciais e Segredos

As APIs upstream compatíveis são públicas e a aplicação não exige credenciais
upstream. Não faça commit, incorpore nem transmita chaves de API, senhas,
cookies, tokens bearer, chaves privadas ou outros segredos. Endpoints que exigem
autenticação não são tratados como operações públicas utilizáveis.

Segredos de ambiente e de implantação, caso uma integração futura exija esses
segredos, devem ser fornecidos pelo gerenciador de segredos da implantação e
nunca devem ser colocados no código-fonte, manifestos, URLs, logs ou fixtures de
teste.

## Controles do MCP Remoto

STDIO é o transporte padrão para uso local. Uma implantação Streamable HTTP não
é segura para exposição pública, a menos que a implantação forneça todos os
seguintes itens:

- TLS, com validação de certificado e HTTP redirecionado ou desabilitado;
- autenticação e autorização no servidor MCP ou em sua borda confiável;
- limitação de taxa para clientes e requisições upstream;
- limites de payload de requisição e resposta, incluindo o tamanho máximo de
  documento configurado de 25 MB;
- concorrência limitada por cliente e por provedor upstream;
- uma política CORS restritiva contendo apenas origens, métodos e cabeçalhos
  explicitamente necessários, ou CORS desabilitado quando não for necessário.

Um endpoint HTTP MCP vinculado apenas a localhost é uma escolha de transporte
local, não um path de escrita: ele continua sujeito ao limite upstream de
somente `GET`. Ele não precisa dos controles remotos públicos acima, a menos
que seja exposto além da máquina local.

Esses controles pertencem ao limite da implantação remota. O fato de as APIs
upstream serem públicas não torna seguro um servidor MCP remoto não autenticado.

## Dados Sensíveis e Registros

Os logs da aplicação e da implantação devem ser estruturados e limitados a um
conjunto allowlisted de metadados operacionais, como identificador da
requisição, provedor, ferramenta, identificador do endpoint, duração, status,
quantidade de tentativas e resultado do cache. A redação ou o hashing devem
ocorrer antes de os valores serem serializados nos logs, e a retenção e o acesso
aos logs devem ser limitados ao necessário para as operações.

Nunca registre corpos completos de requisições ou respostas, cabeçalhos de
autorização, cookies, tokens, credenciais, chaves privadas ou parâmetros
fornecidos pelo usuário sem redação. Faça a redação ou o hashing de
identificadores quando eles puderem conter informações pessoais ou de outra
forma sensíveis. Os corpos de erro upstream são conteúdo de resposta não
confiável e nunca devem ser registrados integralmente; registre apenas um
resumo limitado e com redação ou metadados seguros, como status e um hash do
corpo. Mensagens de erro e traces devem seguir a mesma regra e não devem
preservar corpos upstream completos.

## Comunicação de uma Vulnerabilidade

Relate vulnerabilidades suspeitas em privado por meio do formulário de
Security Advisory do GitHub do repositório:

https://github.com/LeonardoDiasRR/compras-publicas-br/security/advisories/new

Se esse formulário estiver indisponível, use o método de contato privado do
maintainer listado no perfil do proprietário do repositório no GitHub:

https://github.com/LeonardoDiasRR

Não abra uma issue pública nem divulgue a vulnerabilidade publicamente antes de
os maintainers terem uma oportunidade razoável de investigar e coordenar uma
correção.

Inclua a versão ou o commit afetado, uma descrição concisa do impacto, etapas
precisas de reprodução e quaisquer logs relevantes ou prova de conceito após
remover segredos e dados pessoais. Os relatos não devem incluir credenciais
reais ou dados de produção.

Os maintainers confirmarão o recebimento de relatos privados válidos, avaliarão
seu impacto e coordenarão o momento da divulgação com o relator quando
aplicável.
