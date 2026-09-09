# Ferramentas

Ferramentas atômicas geradas a partir do manifesto.

## `compras_listar_modulo_arp_1_1_consultar_arp_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-arp/1.1_consultarARP_Id`
- Descrição: Consulta dados públicos de atas de registro de preços; ação consultar arp id no caminho /modulo-arp/1.1_consultarARP_Id.

### Parâmetros
- `numeroControlePncpAta` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `dataAtualizacao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_arp_1_2_consultar_arp_fim_vigencia`

- Provedor: `compras`
- Endpoint: `GET /modulo-arp/1.2_consultarARP_FimVigencia`
- Descrição: Consulta dados públicos de atas de registro de preços; ação consultar arp fim vigencia no caminho /modulo-arp/1.2_consultarARP_FimVigencia.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoUnidadeGerenciadora` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoModalidadeCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `numeroAtaRegistroPreco` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataVigenciaFinalMin` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataVigenciaFinalMax` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataAssinaturaInicial` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataAssinaturaFinal` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_arp_1_consultar_arp`

- Provedor: `compras`
- Endpoint: `GET /modulo-arp/1_consultarARP`
- Descrição: Consulta dados públicos de atas de registro de preços; ação consultar arp no caminho /modulo-arp/1_consultarARP.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoUnidadeGerenciadora` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoModalidadeCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `numeroAtaRegistroPreco` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataVigenciaInicialMin` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataVigenciaInicialMax` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataAssinaturaInicial` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataAssinaturaFinal` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_arp_2_1_consultar_arpitem_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-arp/2.1_consultarARPItem_Id`
- Descrição: Consulta dados públicos de atas de registro de preços; ação consultar arpitem id no caminho /modulo-arp/2.1_consultarARPItem_Id.

### Parâmetros
- `numeroControlePncpAta` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `dataAtualizacao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_arp_2_consultar_arpitem`

- Provedor: `compras`
- Endpoint: `GET /modulo-arp/2_consultarARPItem`
- Descrição: Consulta dados públicos de atas de registro de preços; ação consultar arpitem no caminho /modulo-arp/2_consultarARPItem.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoUnidadeGerenciadora` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `codigoModalidadeCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataVigenciaInicialMin` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataVigenciaInicialMax` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataAssinaturaInicial` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataAssinaturaFinal` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `numeroItem` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoItem` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `tipoItem` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `niFornecedor` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoPdm` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `numeroCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_arp_3_consultar_unidades_item`

- Provedor: `compras`
- Endpoint: `GET /modulo-arp/3_consultarUnidadesItem`
- Descrição: Consulta dados públicos de atas de registro de preços; ação consultar unidades item no caminho /modulo-arp/3_consultarUnidadesItem.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `numeroAta` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `unidadeGerenciadora` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `numeroItem` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `dataAtualizacao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_arp_4_consultar_empenhos_saldo_item`

- Provedor: `compras`
- Endpoint: `GET /modulo-arp/4_consultarEmpenhosSaldoItem`
- Descrição: Consulta dados públicos de atas de registro de preços; ação consultar empenhos item no caminho /modulo-arp/4_consultarEmpenhosSaldoItem.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `numeroAta` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `unidadeGerenciadora` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `dataAtualizacao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_arp_5_consultar_adesoes_item`

- Provedor: `compras`
- Endpoint: `GET /modulo-arp/5_consultarAdesoesItem`
- Descrição: Consulta dados públicos de atas de registro de preços; ação consultar adesoes item no caminho /modulo-arp/5_consultarAdesoesItem.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `numeroAta` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `unidadeGerenciadora` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `numeroItem` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `unidade` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataAtualizacao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_contratacoes_1_1_consultar_contratacoes_pncp_14133_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id`
- Descrição: Consulta dados públicos de contratações públicas; ação consultar contratacoes pncp 14133 id no caminho /modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id.

### Parâmetros
- `tipo` (`query`, obrigatório): schema: {"enum":["idCompra","numeroControlePNCPCompra"],"type":"string"}; descrição: 
- `codigo` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `dataAtualizacaoPncp` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_contratacoes_1_consultar_contratacoes_pncp_14133`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratacoes/1_consultarContratacoes_PNCP_14133`
- Descrição: Consulta dados públicos de contratações públicas; ação consultar contratacoes pncp no caminho /modulo-contratacoes/1_consultarContratacoes_PNCP_14133.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `unidadeOrgaoCodigoUnidade` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoOrgao` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `orgaoEntidadeCnpj` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataPublicacaoPncpInicial` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataPublicacaoPncpFinal` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `codigoModalidade` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `unidadeOrgaoCodigoIbge` (`query`, opcional): schema: {"type":"integer"}; descrição: 
- `unidadeOrgaoUfSigla` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataAualizacaoPncp` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `amparoLegalCodigoPncp` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `contratacaoExcluida` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_contratacoes_2_1_consultar_itens_contratacoes_pncp_14133_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratacoes/2.1_consultarItensContratacoes_PNCP_14133_Id`
- Descrição: Consulta dados públicos de contratações públicas; ação consultar itens contratacoes pncp 14133 id no caminho /modulo-contratacoes/2.1_consultarItensContratacoes_PNCP_14133_Id.

### Parâmetros
- `tipo` (`query`, obrigatório): schema: {"enum":["idCompra","numeroControlePNCPCompra"],"type":"string"}; descrição: 
- `codigo` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `idCompraItem` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataAtualizacaoPncp` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_contratacoes_2_consultar_itens_contratacoes_pncp_14133`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133`
- Descrição: Consulta dados públicos de contratações públicas; ação consultar itens contratacoes pncp no caminho /modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `unidadeOrgaoCodigoUnidade` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `orgaoEntidadeCnpj` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `situacaoCompraItem` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `materialOuServico` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `codigoGrupo` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `codItemCatalogo` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `temResultado` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `codFornecedor` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataInclusaoPncpInicial` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataInclusaoPncpFinal` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataAtualizacaoPncp` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `bps` (`query`, opcional): schema: {"default":false,"type":"boolean"}; descrição: 
- `margemPreferenciaNormal` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `codigoNCM` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoPdm` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_contratacoes_3_1_consultar_resultado_itens_contratacoes_pncp_14133_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratacoes/3.1_consultarResultadoItensContratacoes_PNCP_14133_Id`
- Descrição: Consulta dados públicos de contratações públicas; ação consultar resultado itens contratacoes pncp 14133 id no caminho /modulo-contratacoes/3.1_consultarResultadoItensContratacoes_PNCP_14133_Id.

### Parâmetros
- `tipo` (`query`, obrigatório): schema: {"enum":["idCompra","numeroControlePNCPCompra"],"type":"string"}; descrição: 
- `codigo` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `idCompraItem` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataAtualizacaoPncp` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_contratacoes_3_consultar_resultado_itens_contratacoes_pncp_14133`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratacoes/3_consultarResultadoItensContratacoes_PNCP_14133`
- Descrição: Consulta dados públicos de contratações públicas; ação consultar resultado itens contratacoes pncp no caminho /modulo-contratacoes/3_consultarResultadoItensContratacoes_PNCP_14133.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `unidadeOrgaoCodigoUnidade` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `orgaoEntidadeCnpj` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `niFornecedor` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoPais` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `porteFornecedorId` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `naturezaJuridicaId` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `situacaoCompraItemResultadoId` (`query`, opcional): schema: {"type":"integer"}; descrição: 
- `valorUnitarioHomologadoInicial` (`query`, opcional): schema: {"type":"number"}; descrição: 
- `valorUnitarioHomologadoFinal` (`query`, opcional): schema: {"type":"number"}; descrição: 
- `valorTotalHomologadoInicial` (`query`, opcional): schema: {"type":"number"}; descrição: 
- `valorTotalHomologadoFinal` (`query`, opcional): schema: {"type":"number"}; descrição: 
- `dataResultadoPncpInicial` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataResultadoPncpFinal` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `aplicacaoMargemPreferencia` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `aplicacaoBeneficioMeepp` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `aplicacaoCriterioDesempate` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_contratos_1_1_consultar_contratos_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratos/1.1_consultarContratos_Id`
- Descrição: Consulta dados públicos de contratos públicos; ação consultar contratos id no caminho /modulo-contratos/1.1_consultarContratos_Id.

### Parâmetros
- `codigo` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `tipo` (`query`, obrigatório): schema: {"enum":["idCompra","numeroControlePncpContrato"],"type":"string"}; descrição: 

## `compras_listar_modulo_contratos_1_2_consultar_contratos_fim_vigencia`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratos/1.2_consultarContratos_FimVigencia`
- Descrição: Consulta dados públicos de contratos públicos; ação consultar contratos fim vigencia no caminho /modulo-contratos/1.2_consultarContratos_FimVigencia.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoOrgao` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `codigoUnidadeGestora` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoUnidadeGestoraOrigemContrato` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoUnidadeRealizadoraCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `numeroContrato` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoModalidadeCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoTipo` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoCategoria` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `niFornecedor` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataVigenciaFinalMin` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataVigenciaFinalMax` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_contratos_1_consultar_contratos`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratos/1_consultarContratos`
- Descrição: Consulta dados públicos de contratos públicos; ação consultar contratos no caminho /modulo-contratos/1_consultarContratos.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoOrgao` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `codigoUnidadeGestora` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoUnidadeGestoraOrigemContrato` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoUnidadeRealizadoraCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `numeroContrato` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoModalidadeCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoTipo` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoCategoria` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `niFornecedor` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataVigenciaInicialMin` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataVigenciaInicialMax` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_contratos_2_1_consultar_contratos_item_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratos/2.1_consultarContratosItem_Id`
- Descrição: Consulta dados públicos de contratos públicos; ação consultar contratos item id no caminho /modulo-contratos/2.1_consultarContratosItem_Id.

### Parâmetros
- `tipo` (`query`, obrigatório): schema: {"enum":["idCompra","numeroControlePncpContrato"],"type":"string"}; descrição: 
- `codigo` (`query`, obrigatório): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_contratos_2_consultar_contratos_item`

- Provedor: `compras`
- Endpoint: `GET /modulo-contratos/2_consultarContratosItem`
- Descrição: Consulta dados públicos de contratos públicos; ação consultar contratos item no caminho /modulo-contratos/2_consultarContratosItem.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoOrgao` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `codigoUnidadeGestora` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoUnidadeGestoraOrigemContrato` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoUnidadeRealizadoraCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `numeroContrato` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoModalidadeCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `tipoItem` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoItem` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `niFornecedor` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataVigenciaInicialMin` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataVigenciaInicialMax` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `poder` (`query`, opcional): schema: {"enum":["Executivo","Legislativo","Judiciário"],"type":"string"}; descrição: 
- `esfera` (`query`, opcional): schema: {"enum":["Federal","Estadual","Municipal"],"type":"string"}; descrição: 
- `idCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_fornecedor_1_consultar_fornecedor`

- Provedor: `compras`
- Endpoint: `GET /modulo-fornecedor/1_consultarFornecedor`
- Descrição: Consulta dados públicos de fornecedores; ação consultar fornecedor no caminho /modulo-fornecedor/1_consultarFornecedor.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `cnpj` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cpf` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `naturezaJuridicaId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `porteEmpresaId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoCnae` (`query`, opcional): schema: {"type":"integer"}; descrição: 
- `ativo` (`query`, obrigatório): schema: {"type":"boolean"}; descrição: 

## `compras_consultar_indicadores_consolidados`

- Provedor: `compras`
- Endpoint: `GET /modulo-indicadores/1_consultarIndicadoresConsolidados`
- Descrição: Consulta dados públicos de indicadores de compras públicas; ação consultar indicadores consolidados no caminho /modulo-indicadores/1_consultarIndicadoresConsolidados.

### Parâmetros

## `compras_listar_modulo_indicadores_2_consultar_indicadores_por_periodo`

- Provedor: `compras`
- Endpoint: `GET /modulo-indicadores/2_consultarIndicadoresPorPeriodo`
- Descrição: Consulta dados públicos de indicadores de compras públicas; ação consultar indicadores por periodo no caminho /modulo-indicadores/2_consultarIndicadoresPorPeriodo.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `ano` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `mes` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 

## `compras_listar_modulo_legado_1_1_consultar_licitacao_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/1.1_consultarLicitacao_Id`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar licitacao id no caminho /modulo-legado/1.1_consultarLicitacao_Id.

### Parâmetros
- `id_compra` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `dt_alteracao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_legado_1_consultar_licitacao`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/1_consultarLicitacao`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar licitacao no caminho /modulo-legado/1_consultarLicitacao.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `uasg` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `numero_aviso` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `modalidade` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `data_publicacao_inicial` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `data_publicacao_final` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `pertence14133` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_legado_2_1_consultar_item_licitacao_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/2.1_consultarItemLicitacao_Id`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar item licitacao id no caminho /modulo-legado/2.1_consultarItemLicitacao_Id.

### Parâmetros
- `id_compra` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `id_compra_item` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dt_alteracao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_legado_2_consultar_item_licitacao`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/2_consultarItemLicitacao`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar item licitacao no caminho /modulo-legado/2_consultarItemLicitacao.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `uasg` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `numero_aviso` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `modalidade` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `decreto_7174` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `codigo_item_material` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `codigo_item_servico` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `cnpj_fornecedor` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cpfVencedor` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_legado_3_1_consultar_pregoes_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/3.1_consultarPregoes_Id`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar pregoes id no caminho /modulo-legado/3.1_consultarPregoes_Id.

### Parâmetros
- `id_compra` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `dt_alteracao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_legado_3_consultar_pregoes`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/3_consultarPregoes`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar pregoes no caminho /modulo-legado/3_consultarPregoes.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `co_uasg` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `co_orgao` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `numero` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `ds_tipo_pregao_compra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dt_data_edital_inicial` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dt_data_edital_final` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `pertence14133` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_legado_4_1_consultar_itens_pregoes_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/4.1_consultarItensPregoes_Id`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar itens pregoes id no caminho /modulo-legado/4.1_consultarItensPregoes_Id.

### Parâmetros
- `id_compra` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `id_compra_item` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dt_alteracao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_legado_4_consultar_itens_pregoes`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/4_consultarItensPregoes`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar itens pregoes no caminho /modulo-legado/4_consultarItensPregoes.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `co_uasg` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `decreto_7174` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `fornecedor_vencedor` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dt_hom_inicial` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dt_hom_final` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_legado_5_1_consultar_compra_sem_licitacao_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/5.1_consultarCompraSemLicitacao_Id`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar compra sem licitacao id no caminho /modulo-legado/5.1_consultarCompraSemLicitacao_Id.

### Parâmetros
- `idCompra` (`query`, obrigatório): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_legado_5_consultar_compras_sem_licitacao`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/5_consultarComprasSemLicitacao`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar compras sem licitacao no caminho /modulo-legado/5_consultarComprasSemLicitacao.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `dt_ano_aviso` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `nu_aviso_licitacao` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `co_modalidade_licitacao` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `co_orgao` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `co_orgao_superior` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `co_uasg` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `dtDeclaracaoDispensaInicial` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dtDeclaracaoDispensaFinal` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dtRatificacao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dtPublicacao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `pertence14133` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_legado_6_1_consultar_itens_compras_sem_licitacao_id`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/6.1_consultarItensComprasSemLicitacao_Id`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar itens compras sem licitacao id no caminho /modulo-legado/6.1_consultarItensComprasSemLicitacao_Id.

### Parâmetros
- `id_compra` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `id_compra_item` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dt_alteracao` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_legado_6_consultar_compra_itens_sem_licitacao`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/6_consultarCompraItensSemLicitacao`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar compra itens sem licitacao no caminho /modulo-legado/6_consultarCompraItensSemLicitacao.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `co_uasg` (`query`, opcional): schema: {"type":"integer"}; descrição: 
- `co_orgao` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dt_ano_aviso_licitacao` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `co_modalidade_licitacao` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `co_conjunto_materiais` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `co_servico` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `nu_cpf_cnpj_fornecedor` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_legado_7_consultar_rdc`

- Provedor: `compras`
- Endpoint: `GET /modulo-legado/7_consultarRdc`
- Descrição: Consulta dados públicos de licitações e compras legadas; ação consultar rdc no caminho /modulo-legado/7_consultarRdc.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `data_publicacao_min` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `data_publicacao_max` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `endereco_entrega_edital` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `forma_de_realizacao` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `funcao_responsavel` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `modalidade` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `nome_responsavel` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `numero_aviso` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `objeto` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `orgao` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `situacao_aviso` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `uasg` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `uf_uasg` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `valor_estimado_total_max` (`query`, opcional): schema: {"type":"number"}; descrição: 
- `valor_estimado_total_min` (`query`, opcional): schema: {"type":"number"}; descrição: 
- `valor_homologado_total_max` (`query`, opcional): schema: {"type":"number"}; descrição: 
- `valor_homologado_total_min` (`query`, opcional): schema: {"type":"number"}; descrição: 

## `compras_listar_modulo_material_1_consultar_grupo_material`

- Provedor: `compras`
- Endpoint: `GET /modulo-material/1_consultarGrupoMaterial`
- Descrição: Consulta dados públicos de materiais para compras públicas; ação consultar grupo material no caminho /modulo-material/1_consultarGrupoMaterial.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoGrupo` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusGrupo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_material_2_consultar_classe_material`

- Provedor: `compras`
- Endpoint: `GET /modulo-material/2_consultarClasseMaterial`
- Descrição: Consulta dados públicos de materiais para compras públicas; ação consultar classe material no caminho /modulo-material/2_consultarClasseMaterial.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoGrupo` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusClasse` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `bps` (`query`, opcional): schema: {"default":false,"type":"boolean"}; descrição: 

## `compras_listar_modulo_material_3_consultar_pdm_material`

- Provedor: `compras`
- Endpoint: `GET /modulo-material/3_consultarPdmMaterial`
- Descrição: Consulta dados públicos de materiais para compras públicas; ação consultar pdm material no caminho /modulo-material/3_consultarPdmMaterial.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `statusPdm` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `codigoPdm` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoGrupo` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `bps` (`query`, opcional): schema: {"default":false,"type":"boolean"}; descrição: 

## `compras_listar_modulo_material_4_consultar_item_material`

- Provedor: `compras`
- Endpoint: `GET /modulo-material/4_consultarItemMaterial`
- Descrição: Consulta dados públicos de materiais para compras públicas; ação consultar item material no caminho /modulo-material/4_consultarItemMaterial.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoItem` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoGrupo` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoPdm` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `descricaoItem` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `statusItem` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `bps` (`query`, opcional): schema: {"default":false,"type":"boolean"}; descrição: 
- `codigo_ncm` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_material_5_consultar_material_natureza_despesa`

- Provedor: `compras`
- Endpoint: `GET /modulo-material/5_consultarMaterialNaturezaDespesa`
- Descrição: Consulta dados públicos de materiais para compras públicas; ação consultar material natureza despesa no caminho /modulo-material/5_consultarMaterialNaturezaDespesa.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoPdm` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoNaturezaDespesa` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `statusNaturezaDespesa` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_material_6_consultar_material_unidade_fornecimento`

- Provedor: `compras`
- Endpoint: `GET /modulo-material/6_consultarMaterialUnidadeFornecimento`
- Descrição: Consulta dados públicos de materiais para compras públicas; ação consultar material unidade fornecimento no caminho /modulo-material/6_consultarMaterialUnidadeFornecimento.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoPdm` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusUnidadeFornecimentoPdm` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_material_7_consultar_material_caracteristicas`

- Provedor: `compras`
- Endpoint: `GET /modulo-material/7_consultarMaterialCaracteristicas`
- Descrição: Consulta dados públicos de materiais para compras públicas; ação consultar material caracteristicas no caminho /modulo-material/7_consultarMaterialCaracteristicas.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoItem` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 

## `compras_listar_modulo_ocds_1_releases`

- Provedor: `compras`
- Endpoint: `GET /modulo-ocds/1_releases`
- Descrição: Consulta dados públicos de dados de contratações no padrão OCDS; ação listar releases no caminho /modulo-ocds/1_releases.

### Parâmetros
- `page` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `offSet` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `buyerID` (`query`, obrigatório): schema: {"description":"BR-CNPJ","type":"string"}; descrição: BR-CNPJ
- `releaseStartDate` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `releaseEndDate` (`query`, obrigatório): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_1_1_consultar_material_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/1.1_consultarMaterial_CSV`
- Descrição: Consulta dados públicos de pesquisa de preços; ação consultar material csv no caminho /modulo-pesquisa-preco/1.1_consultarMaterial_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `tipo` (`query`, obrigatório): schema: {"enum":["codigoItemCatalogo","codigoPdm"],"type":"string"}; descrição: 
- `codigo` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `codigoUasg` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `estado` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoMunicipio` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `dataResultado` (`query`, opcional): schema: {"default":false,"type":"boolean"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `poder` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `esfera` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `idCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataCompraInicio` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataCompraFim` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_1_consultar_material`

- Provedor: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/1_consultarMaterial`
- Descrição: Consulta dados públicos de pesquisa de preços; ação consultar material no caminho /modulo-pesquisa-preco/1_consultarMaterial.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `tipo` (`query`, obrigatório): schema: {"enum":["codigoItemCatalogo","codigoPdm"],"type":"string"}; descrição: 
- `codigo` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `codigoUasg` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `estado` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoMunicipio` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `dataResultado` (`query`, opcional): schema: {"default":false,"type":"boolean"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `poder` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `esfera` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `idCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataCompraInicio` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataCompraFim` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_2_1_consultar_material_detalhe_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/2.1_consultarMaterialDetalhe_CSV`
- Descrição: Consulta dados públicos de pesquisa de preços; ação consultar material detalhe csv no caminho /modulo-pesquisa-preco/2.1_consultarMaterialDetalhe_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoItemCatalogo` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `dataCompraInicio` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataCompraFim` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_2_consultar_material_detalhe`

- Provedor: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/2_consultarMaterialDetalhe`
- Descrição: Consulta dados públicos de pesquisa de preços; ação consultar material detalhe no caminho /modulo-pesquisa-preco/2_consultarMaterialDetalhe.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoItemCatalogo` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `dataCompraInicio` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataCompraFim` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_3_1_consultar_servico_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/3.1_consultarServico_CSV`
- Descrição: Consulta dados públicos de pesquisa de preços; ação consultar servico csv no caminho /modulo-pesquisa-preco/3.1_consultarServico_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoItemCatalogo` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `codigoUasg` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `estado` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoMunicipio` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `dataResultado` (`query`, opcional): schema: {"default":false,"type":"boolean"}; descrição: 
- `poder` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `esfera` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataCompraInicio` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataCompraFim` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `idCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_pesquisa_preco_3_consultar_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/3_consultarServico`
- Descrição: Consulta dados públicos de pesquisa de preços; ação consultar servico no caminho /modulo-pesquisa-preco/3_consultarServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoItemCatalogo` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `codigoUasg` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `estado` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoMunicipio` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `dataResultado` (`query`, opcional): schema: {"default":false,"type":"boolean"}; descrição: 
- `poder` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `esfera` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `dataCompraInicio` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataCompraFim` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `idCompra` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_pesquisa_preco_4_1_consultar_servico_detalhe_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/4.1_consultarServicoDetalhe_CSV`
- Descrição: Consulta dados públicos de pesquisa de preços; ação consultar servico detalhe csv no caminho /modulo-pesquisa-preco/4.1_consultarServicoDetalhe_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoItemCatalogo` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `dataCompraInicio` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataCompraFim` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_4_consultar_servico_detalhe`

- Provedor: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/4_consultarServicoDetalhe`
- Descrição: Consulta dados públicos de pesquisa de preços; ação consultar servico detalhe no caminho /modulo-pesquisa-preco/4_consultarServicoDetalhe.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoItemCatalogo` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `dataCompraInicio` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD
- `dataCompraFim` (`query`, opcional): schema: {"description":"YYYY-MM-DD","type":"string"}; descrição: YYYY-MM-DD

## `compras_listar_modulo_pgc_1_1_consultar_pgc_detalhe_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-pgc/1.1_consultarPgcDetalhe_CSV`
- Descrição: Consulta dados públicos de planejamento de contratações; ação consultar pgc detalhe csv no caminho /modulo-pgc/1.1_consultarPgcDetalhe_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `orgao` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `anoPcaProjetoCompra` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `codigoUasg` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_pgc_1_consultar_pgc_detalhe`

- Provedor: `compras`
- Endpoint: `GET /modulo-pgc/1_consultarPgcDetalhe`
- Descrição: Consulta dados públicos de planejamento de contratações; ação consultar pgc detalhe no caminho /modulo-pgc/1_consultarPgcDetalhe.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `orgao` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `anoPcaProjetoCompra` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `codigoUasg` (`query`, opcional): schema: {"type":"string"}; descrição: 

## `compras_listar_modulo_pgc_2_1_consultar_pgc_detalhe_catalogo_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-pgc/2.1_consultarPgcDetalheCatalogo_CSV`
- Descrição: Consulta dados públicos de planejamento de contratações; ação consultar pgc detalhe catalogo csv no caminho /modulo-pgc/2.1_consultarPgcDetalheCatalogo_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `anoPcaProjetoCompra` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `tipo` (`query`, obrigatório): schema: {"enum":["Servico","Material"],"type":"string"}; descrição: 
- `codigo` (`query`, obrigatório): schema: {"description":"Código de classe para material ou código do grupo para serviço","format":"int32","type":"integer"}; descrição: Código de classe para material ou código do grupo para serviço

## `compras_listar_modulo_pgc_2_consultar_pgc_detalhe_catalogo`

- Provedor: `compras`
- Endpoint: `GET /modulo-pgc/2_consultarPgcDetalheCatalogo`
- Descrição: Consulta dados públicos de planejamento de contratações; ação consultar pgc detalhe catalogo no caminho /modulo-pgc/2_consultarPgcDetalheCatalogo.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `anoPcaProjetoCompra` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `tipo` (`query`, obrigatório): schema: {"enum":["Servico","Material"],"type":"string"}; descrição: 
- `codigo` (`query`, obrigatório): schema: {"description":"Código de classe para material ou código do grupo para serviço","format":"int32","type":"integer"}; descrição: Código de classe para material ou código do grupo para serviço

## `compras_listar_modulo_pgc_3_1_consultar_pgc_agregacao_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-pgc/3.1_consultarPgcAgregacao_CSV`
- Descrição: Consulta dados públicos de planejamento de contratações; ação consultar pgc agregacao csv no caminho /modulo-pgc/3.1_consultarPgcAgregacao_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `orgao` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `compras_listar_modulo_pgc_3_consultar_pgc_agregacao`

- Provedor: `compras`
- Endpoint: `GET /modulo-pgc/3_consultarPgcAgregacao`
- Descrição: Consulta dados públicos de planejamento de contratações; ação consultar pgc agregacao no caminho /modulo-pgc/3_consultarPgcAgregacao.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `orgao` (`query`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`query`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `compras_listar_modulo_servico_1_consultar_secao_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-servico/1_consultarSecaoServico`
- Descrição: Consulta dados públicos de serviços para compras públicas; ação consultar secao servico no caminho /modulo-servico/1_consultarSecaoServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoSecao` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusSecao` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_servico_2_consultar_divisao_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-servico/2_consultarDivisaoServico`
- Descrição: Consulta dados públicos de serviços para compras públicas; ação consultar divisao servico no caminho /modulo-servico/2_consultarDivisaoServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoSecao` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoDivisao` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusDivisao` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_servico_3_consultar_grupo_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-servico/3_consultarGrupoServico`
- Descrição: Consulta dados públicos de serviços para compras públicas; ação consultar grupo servico no caminho /modulo-servico/3_consultarGrupoServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoDivisao` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoGrupo` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusGrupo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_servico_4_consultar_classe_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-servico/4_consultarClasseServico`
- Descrição: Consulta dados públicos de serviços para compras públicas; ação consultar classe servico no caminho /modulo-servico/4_consultarClasseServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoGrupo` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusGrupo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_servico_5_consultar_sub_classe_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-servico/5_consultarSubClasseServico`
- Descrição: Consulta dados públicos de serviços para compras públicas; ação consultar sub classe servico no caminho /modulo-servico/5_consultarSubClasseServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoSubclasse` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusSubclasse` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_servico_6_consultar_item_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-servico/6_consultarItemServico`
- Descrição: Consulta dados públicos de serviços para compras públicas; ação consultar item servico no caminho /modulo-servico/6_consultarItemServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","type":"integer"}; descrição: 
- `codigoSecao` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoDivisao` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoGrupo` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoClasse` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoSubclasse` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoCpc` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoServico` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `exclusivoCentralCompras` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `statusServico` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_servico_7_consultar_und_medida_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-servico/7_consultarUndMedidaServico`
- Descrição: Consulta dados públicos de serviços para compras públicas; ação consultar und medida servico no caminho /modulo-servico/7_consultarUndMedidaServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoServico` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusUnidadeMedida` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_servico_8_consultar_natureza_despesa_servico`

- Provedor: `compras`
- Endpoint: `GET /modulo-servico/8_consultarNaturezaDespesaServico`
- Descrição: Consulta dados públicos de serviços para compras públicas; ação consultar natureza despesa servico no caminho /modulo-servico/8_consultarNaturezaDespesaServico.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoServico` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `codigoNaturezaDespesa` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `statusNaturezaDespesa` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_uasg_1_1_consultar_uasg_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-uasg/1.1_consultarUasg_CSV`
- Descrição: Consulta dados públicos de órgãos e unidades administrativas; ação consultar uasg csv no caminho /modulo-uasg/1.1_consultarUasg_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoUasg` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `usoSisg` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `cnpjCpfOrgao` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cnpjCpfOrgaoVinculado` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cnpjCpfOrgaoSuperior` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `siglaUf` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `statusUasg` (`query`, obrigatório): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_uasg_1_consultar_uasg`

- Provedor: `compras`
- Endpoint: `GET /modulo-uasg/1_consultarUasg`
- Descrição: Consulta dados públicos de órgãos e unidades administrativas; ação consultar uasg no caminho /modulo-uasg/1_consultarUasg.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `codigoUasg` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `usoSisg` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `cnpjCpfOrgao` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cnpjCpfOrgaoVinculado` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cnpjCpfOrgaoSuperior` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `siglaUf` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `statusUasg` (`query`, obrigatório): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_uasg_2_1_consultar_orgao_csv`

- Provedor: `compras`
- Endpoint: `GET /modulo-uasg/2.1_consultarOrgao_CSV`
- Descrição: Consulta dados públicos de órgãos e unidades administrativas; ação consultar orgao csv no caminho /modulo-uasg/2.1_consultarOrgao_CSV.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `cnpjCpfOrgao` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cnpjCpfOrgaoVinculado` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cnpjCpfOrgaoSuperior` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoOrgao` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `statusOrgao` (`query`, obrigatório): schema: {"type":"boolean"}; descrição: 
- `usoSisg` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `compras_listar_modulo_uasg_2_consultar_orgao`

- Provedor: `compras`
- Endpoint: `GET /modulo-uasg/2_consultarOrgao`
- Descrição: Consulta dados públicos de órgãos e unidades administrativas; ação consultar orgao no caminho /modulo-uasg/2_consultarOrgao.

### Parâmetros
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","type":"integer"}; descrição: 
- `cnpjCpfOrgao` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cnpjCpfOrgaoVinculado` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `cnpjCpfOrgaoSuperior` (`query`, opcional): schema: {"type":"string"}; descrição: 
- `codigoOrgao` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `statusOrgao` (`query`, obrigatório): schema: {"type":"boolean"}; descrição: 
- `usoSisg` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_listar_amparos_legais`

- Provedor: `pncp`
- Endpoint: `GET /v1/amparos-legais`
- Descrição: Consulta dados públicos de amparos legais; ação listar registros no caminho /v1/amparos-legais.

### Parâmetros
- `tipoAmparoLegalId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_amparos_legais_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/amparos-legais/{id}`
- Descrição: Consulta dados públicos de amparos legais; ação obter registro no caminho /v1/amparos-legais/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_catalogos`

- Provedor: `pncp`
- Endpoint: `GET /v1/catalogos`
- Descrição: Consulta dados públicos de catálogos de itens; ação listar registros no caminho /v1/catalogos.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_catalogos_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/catalogos/{id}`
- Descrição: Consulta dados públicos de catálogos de itens; ação obter registro no caminho /v1/catalogos/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_categoria_item_pcas`

- Provedor: `pncp`
- Endpoint: `GET /v1/categoriaItemPcas`
- Descrição: Consulta dados públicos de categorias de itens de planos de contratações anuais; ação listar registros no caminho /v1/categoriaItemPcas.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_categoria_item_pcas_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/categoriaItemPcas/{id}`
- Descrição: Consulta dados públicos de categorias de itens de planos de contratações anuais; ação obter registro no caminho /v1/categoriaItemPcas/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_criterios_julgamentos`

- Provedor: `pncp`
- Endpoint: `GET /v1/criterios-julgamentos`
- Descrição: Consulta dados públicos de critérios de julgamento; ação listar registros no caminho /v1/criterios-julgamentos.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_criterios_julgamentos_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/criterios-julgamentos/{id}`
- Descrição: Consulta dados públicos de critérios de julgamento; ação obter registro no caminho /v1/criterios-julgamentos/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_fontes_orcamentarias`

- Provedor: `pncp`
- Endpoint: `GET /v1/fontes-orcamentarias`
- Descrição: Consulta dados públicos de fontes orçamentárias; ação listar registros no caminho /v1/fontes-orcamentarias.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_fontes_orcamentarias_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/fontes-orcamentarias/{id}`
- Descrição: Consulta dados públicos de fontes orçamentárias; ação obter registro no caminho /v1/fontes-orcamentarias/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_instrumento_convocatorio_modalidade_amparo_legal`

- Provedor: `pncp`
- Endpoint: `GET /v1/instrumento-convocatorio-modalidade-amparo-legal`
- Descrição: Consulta dados públicos de instrumentos convocatórios, modalidades e amparos legais; ação consultar no caminho /v1/instrumento-convocatorio-modalidade-amparo-legal.

### Parâmetros
- `amparoLegalId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `modalidadeId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `tipoInstrumentoConvocatorioId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_obter_instrumento_convocatorio_modalidade_amparo_legal_por_amparolegalid_modalidadeid_tipoinstrumentoconvocatorioid`

- Provedor: `pncp`
- Endpoint: `GET /v1/instrumento-convocatorio-modalidade-amparo-legal/{amparoLegalId}/{modalidadeId}/{tipoInstrumentoConvocatorioId}`
- Descrição: Consulta dados públicos de instrumentos convocatórios, modalidades e amparos legais; ação obter registro no caminho /v1/instrumento-convocatorio-modalidade-amparo-legal/{amparoLegalId}/{modalidadeId}/{tipoInstrumentoConvocatorioId}.

### Parâmetros
- `amparoLegalId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 
- `modalidadeId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 
- `tipoInstrumentoConvocatorioId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_modalidade_criterio_julgamento`

- Provedor: `pncp`
- Endpoint: `GET /v1/modalidade-criterio-julgamento`
- Descrição: Consulta dados públicos de modalidades e critérios de julgamento; ação obter criterios julgamento por modalidade no caminho /v1/modalidade-criterio-julgamento.

### Parâmetros
- `modalidadeId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `criterioJulgamentoId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_obter_modalidade_criterio_julgamento_por_modalidadeid_criteriojulgamentoid`

- Provedor: `pncp`
- Endpoint: `GET /v1/modalidade-criterio-julgamento/{modalidadeId}/{criterioJulgamentoId}`
- Descrição: Consulta dados públicos de modalidades e critérios de julgamento; ação obter modalidade criterio julgamento no caminho /v1/modalidade-criterio-julgamento/{modalidadeId}/{criterioJulgamentoId}.

### Parâmetros
- `modalidadeId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 
- `criterioJulgamentoId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_modalidade_fonte_orcamentaria`

- Provedor: `pncp`
- Endpoint: `GET /v1/modalidade-fonte-orcamentaria`
- Descrição: Consulta dados públicos de modalidades e fontes orçamentárias; ação obter fonte orcamentaria por modalidade no caminho /v1/modalidade-fonte-orcamentaria.

### Parâmetros
- `modalidadeId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `fonteOrcamentariaId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_obter_modalidade_fonte_orcamentaria_por_modalidadeid_fonteorcamentariaid`

- Provedor: `pncp`
- Endpoint: `GET /v1/modalidade-fonte-orcamentaria/{modalidadeId}/{fonteOrcamentariaId}`
- Descrição: Consulta dados públicos de modalidades e fontes orçamentárias; ação obter modalidade fonte orcamentaria no caminho /v1/modalidade-fonte-orcamentaria/{modalidadeId}/{fonteOrcamentariaId}.

### Parâmetros
- `modalidadeId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 
- `fonteOrcamentariaId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_modalidades`

- Provedor: `pncp`
- Endpoint: `GET /v1/modalidades`
- Descrição: Consulta dados públicos de modalidades de contratação; ação listar registros no caminho /v1/modalidades.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 
- `irp` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_modalidades_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/modalidades/{id}`
- Descrição: Consulta dados públicos de modalidades de contratação; ação obter registro no caminho /v1/modalidades/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_modos_disputas`

- Provedor: `pncp`
- Endpoint: `GET /v1/modos-disputas`
- Descrição: Consulta dados públicos de modos de disputa; ação listar registros no caminho /v1/modos-disputas.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_modos_disputas_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/modos-disputas/{id}`
- Descrição: Consulta dados públicos de modos de disputa; ação obter registro no caminho /v1/modos-disputas/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_orgaos`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/`
- Descrição: Consulta dados públicos de órgãos e unidades públicas; ação consultar entes por filtro no caminho /v1/orgaos/.

### Parâmetros
- `razaoSocial` (`query`, obrigatório): schema: {"maxLength":2147483647,"minLength":3,"type":"string"}; descrição: Razão social com pelo menos 3 caracteres
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","minimum":1,"type":"integer"}; descrição: Índice de paginação iniciando com valor = 1

## `pncp_obter_orgaos_id_por_orgaoid`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/id/{orgaoId}`
- Descrição: Consulta dados públicos de órgãos e unidades públicas; ação consultar ente no caminho /v1/orgaos/id/{orgaoId}.

### Parâmetros
- `orgaoId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_obter_orgaos_por_cnpj`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}`
- Descrição: Consulta dados públicos de órgãos e unidades públicas; ação consultar ente no caminho /v1/orgaos/{cnpj}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 

## `pncp_obter_orgaos_compras_atas_por_cnpj_anocompra_sequencialcompra`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar atas por filtros no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `anoCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":10,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_atas_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar ata registo preco no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `anoCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_atas_arquivos_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar informacoes documentos ata no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"maxLength":14,"minLength":14,"type":"string"}; descrição: 
- `anoCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_atas_arquivos_quantidade_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos/quantidade`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar ata documento quantidade no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `anoCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_atas_arquivos_por_cnpj_anocompra_sequencialcompra_sequencialata_sequencialdocumento`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos/{sequencialDocumento}`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar arquivo no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos/{sequencialDocumento}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"maxLength":14,"minLength":14,"type":"string"}; descrição: 
- `anoCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialDocumento` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_atas_contratos_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/contratos`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar contratos ata registo preco no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/contratos.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: CNPJ da Compra
- `anoCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Ano da Compra
- `sequencialCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Sequencial da Compra
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Sequencial da Ata
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":10,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_atas_partesenvolvidas_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/partesenvolvidas`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação buscar no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/partesenvolvidas.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: CNPJ da Compra
- `anoCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Ano da Compra
- `sequencialCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Sequencial da Compra
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Sequencial da Ata
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":10,"type":"integer"}; descrição: 

## `pncp_obter_parte_envolvida_ata`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/partesenvolvidas/{cnpjOrgao}/{codUnidade}/{tipoParteEnvolvida}`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar parte envolvida ata no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/partesenvolvidas/{cnpjOrgao}/{codUnidade}/{tipoParteEnvolvida}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: CNPJ da Compra
- `anoCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Ano da Compra
- `sequencialCompra` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Sequencial da Compra
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: Sequencial da Ata
- `cnpjOrgao` (`path`, obrigatório): schema: {"type":"string"}; descrição: CNPJ do orgão da Parte Envolvida
- `codUnidade` (`path`, obrigatório): schema: {"type":"string"}; descrição: Código da unidade da Parte Envolvida
- `tipoParteEnvolvida` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: Tipo de parte Envolvida

## `pncp_obter_orgaos_compras_arquivos_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar informacoes documentos compra no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_arquivos_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/quantidade`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar compra documento quantidade no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_arquivos_por_cnpj_ano_sequencial_sequencialdocumento`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/{sequencialDocumento}`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar arquivo no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/{sequencialDocumento}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialDocumento` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_atas_historico_por_cnpj_ano_sequencial_sequencialata`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}/historico`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar historico ata no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}/historico.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_atas_historico_quantidade_por_cnpj_ano_sequencial_sequencialata`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}/historico/quantidade`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar historico ata quantidade no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}/historico/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialAta` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_fonte_orcamentaria_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/fonte-orcamentaria`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação listar registros no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/fonte-orcamentaria.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_fonte_orcamentaria_por_cnpj_ano_sequencial_fonteorcamentariaid`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/fonte-orcamentaria/{fonteOrcamentariaId}`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação obter registro no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/fonte-orcamentaria/{fonteOrcamentariaId}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `fonteOrcamentariaId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_historico_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar compra no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_historico_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico/quantidade`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar quantidade no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_itens_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar pesquisar compra item no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_itens_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/quantidade`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar compra item quantidade no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_itens_por_cnpj_ano_sequencial_numeroitem`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar compra item no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `numeroItem` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_itens_imagem_por_cnpj_ano_sequencial_numeroitem`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/imagem`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação obter imagem lista no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/imagem.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `numeroItem` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_itens_imagem_por_cnpj_ano_sequencial_numeroitem_sequencialimagem`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/imagem/{sequencialImagem}`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação obter imagem no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/imagem/{sequencialImagem}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `numeroItem` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialImagem` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_itens_resultados_por_cnpj_ano_sequencial_numeroitem`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar resultados no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `numeroItem` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_compras_itens_resultados_por_cnpj_ano_sequencial_numeroitem_sequencialresultado`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados/{sequencialResultado}`
- Descrição: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar resultado no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados/{sequencialResultado}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `numeroItem` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialResultado` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_contratacao_por_cnpj_anocontratacao_sequencialcontratacao`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/contratacao/{anoContratacao}/{sequencialContratacao}`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar contratos contratacao no caminho /v1/orgaos/{cnpj}/contratos/contratacao/{anoContratacao}/{sequencialContratacao}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `anoContratacao` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialContratacao` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","maximum":50,"minimum":10,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_instrumentocobranca_por_cnpj_ano_sequencialcontrato`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/instrumentocobranca`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar instrumentos cobranca no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/instrumentocobranca.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialContrato` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_instrumentocobranca_por_cnpj_ano_sequencialcontrato_sequencialinstrumentocobranca`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/instrumentocobranca/{sequencialInstrumentoCobranca}`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar instrumento cobranca no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/instrumentocobranca/{sequencialInstrumentoCobranca}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencialContrato` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialInstrumentoCobranca` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_arquivos_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar informacoes documentos contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_arquivos_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos/quantidade`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar contrato documento quantidade no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_arquivos_por_cnpj_ano_sequencial_sequencialdocumento`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos/{sequencialDocumento}`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar arquivo no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos/{sequencialDocumento}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialDocumento` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_empenhos_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/empenhos`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar empenhos do contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/empenhos.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":10,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_empenhos_por_cnpj_ano_sequencial_sequencialempenho`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/empenhos/{sequencialEmpenho}`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar empenho pelo numero sequencial no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/empenhos/{sequencialEmpenho}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialEmpenho` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_historico_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_historico_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico/quantidade`
- Descrição: Consulta a quantidade de registros do histórico do contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_termos_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar termos contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_termos_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/quantidade`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar quantidade termos contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_termos_por_cnpj_ano_sequencial_sequencialtermocontrato`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermoContrato}`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar termo contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermoContrato}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialTermoContrato` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_termos_arquivos_por_cnpj_ano_sequencial_sequencialtermo`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar informacoes documentos termo contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialTermo` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_termos_arquivos_quantidade_por_cnpj_ano_sequencial_sequencialtermo`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos/quantidade`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar quantidade documentos termo contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialTermo` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_contratos_termos_arquivos_por_cnpj_ano_sequencial_sequencialtermo_sequencialdocumento`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos/{sequencialDocumento}`
- Descrição: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar arquivo no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos/{sequencialDocumento}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialTermo` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `sequencialDocumento` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_irp_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}`
- Descrição: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_irp_arquivos_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/arquivos`
- Descrição: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar informacoes documentos irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/arquivos.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"maxLength":14,"minLength":14,"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_irp_arquivos_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/arquivos/quantidade`
- Descrição: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar irp documento quantidade no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/arquivos/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_irp_historico_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/historico`
- Descrição: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/historico.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_irp_historico_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/historico/quantidade`
- Descrição: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar quantidade no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/historico/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_irp_itens_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens`
- Descrição: Consulta dados públicos de intenções de registro de preços e seus itens; ação listar itens irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","maximum":50,"minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_irp_itens_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens/quantidade`
- Descrição: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar quantidade itens irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_irp_itens_por_cnpj_ano_sequencial_numeroitem`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens/{numeroItem}`
- Descrição: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar item irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens/{numeroItem}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `numeroItem` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_consolidado_por_cnpj_ano`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/consolidado`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar dados orgao pca no caminho /v1/orgaos/{cnpj}/pca/{ano}/consolidado.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_consolidado_unidades_por_cnpj_ano`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/consolidado/unidades`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar dados orgao pca unidades no caminho /v1/orgaos/{cnpj}/pca/{ano}/consolidado/unidades.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_csv_por_cnpj_ano`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/csv`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação listar planos todas unidades do orgao csv no caminho /v1/orgaos/{cnpj}/pca/{ano}/csv.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_quantidade_por_cnpj_ano`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/quantidade`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar dados orgao pca quantidade no caminho /v1/orgaos/{cnpj}/pca/{ano}/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_valorescategoriaitem_por_cnpj_ano`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/valorescategoriaitem`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar valores categoria item no caminho /v1/orgaos/{cnpj}/pca/{ano}/valorescategoriaitem.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `categoriaItem` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_consolidado_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/consolidado`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar plano consolidado no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/consolidado.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_itens_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar dados pca itens categoria no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `categoria` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 
- `pagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_itens_contratacao_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/contratacao`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar itens plano por contratacao no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/contratacao.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `numeroContratacao` (`query`, obrigatório): schema: {"maxLength":100,"minLength":0,"type":"string"}; descrição: 
- `pagina` (`query`, opcional): schema: {"default":1,"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `tamanhoPagina` (`query`, opcional): schema: {"default":10,"format":"int32","minimum":10,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_itens_plano_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/plano`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar plano com itens no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/plano.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_itens_quantidade_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/quantidade`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar dados pca itens quantidade itens no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/quantidade.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `categoria` (`query`, opcional): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_valorescategoriaitem_por_cnpj_ano_sequencial`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/valorescategoriaitem`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar valores categoria item no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/valorescategoriaitem.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 
- `sequencial` (`path`, obrigatório): schema: {"format":"int32","minimum":1,"type":"integer"}; descrição: 
- `categoriaItem` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_obter_orgaos_pca_sequenciaisplano_por_cnpj_uasg_ano`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{uasg}/{ano}/sequenciaisplano`
- Descrição: Consulta dados públicos de planos de contratações anuais; ação consultar sequenciais do plano no caminho /v1/orgaos/{cnpj}/pca/{uasg}/{ano}/sequenciaisplano.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `uasg` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `ano` (`path`, obrigatório): schema: {"format":"int32","type":"integer"}; descrição: 

## `pncp_obter_orgaos_unidades_por_cnpj`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/unidades`
- Descrição: Consulta dados públicos de órgãos e unidades públicas; ação consultar unidades orgao no caminho /v1/orgaos/{cnpj}/unidades.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 

## `pncp_obter_orgaos_unidades_por_cnpj_codigounidade`

- Provedor: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/unidades/{codigoUnidade}`
- Descrição: Consulta dados públicos de órgãos e unidades públicas; ação consultar unidade orgao no caminho /v1/orgaos/{cnpj}/unidades/{codigoUnidade}.

### Parâmetros
- `cnpj` (`path`, obrigatório): schema: {"type":"string"}; descrição: 
- `codigoUnidade` (`path`, obrigatório): schema: {"type":"string"}; descrição: 

## `pncp_listar_portes_empresa`

- Provedor: `pncp`
- Endpoint: `GET /v1/portes-empresa`
- Descrição: Consulta dados públicos de portes de empresa; ação listar registros no caminho /v1/portes-empresa.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_portes_empresa_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/portes-empresa/{id}`
- Descrição: Consulta dados públicos de portes de empresa; ação obter registro no caminho /v1/portes-empresa/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_tipo_instrumento_convocatorio_modo_disputa`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipo-instrumento-convocatorio-modo-disputa`
- Descrição: Consulta dados públicos de instrumentos convocatórios e modos de disputa; ação listar registros no caminho /v1/tipo-instrumento-convocatorio-modo-disputa.

### Parâmetros
- `tipoInstrumentoConvocatorioId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 
- `modoDisputaId` (`query`, opcional): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_obter_tipo_instrumento_convocatorio_modo_disputa_por_tipoinstrumentoconvocatorioid_mododisputaid`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipo-instrumento-convocatorio-modo-disputa/{tipoInstrumentoConvocatorioId}/{modoDisputaId}`
- Descrição: Consulta dados públicos de instrumentos convocatórios e modos de disputa; ação obter registro no caminho /v1/tipo-instrumento-convocatorio-modo-disputa/{tipoInstrumentoConvocatorioId}/{modoDisputaId}.

### Parâmetros
- `tipoInstrumentoConvocatorioId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 
- `modoDisputaId` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_tipos_contratos`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-contratos`
- Descrição: Consulta dados públicos de tipos de contratos; ação listar registros no caminho /v1/tipos-contratos.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_tipos_contratos_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-contratos/{id}`
- Descrição: Consulta dados públicos de tipos de contratos; ação obter registro no caminho /v1/tipos-contratos/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_tipos_documentos`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-documentos`
- Descrição: Consulta dados públicos de tipos de documentos; ação listar registros no caminho /v1/tipos-documentos.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: Indicador de Status Ativo (True - Ativo/False - Inativo)

## `pncp_obter_tipos_documentos_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-documentos/{id}`
- Descrição: Consulta dados públicos de tipos de documentos; ação obter registro no caminho /v1/tipos-documentos/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_tipos_instrumentos_cobranca`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-instrumentos-cobranca`
- Descrição: Consulta dados públicos de tipos de instrumentos de cobrança; ação listar registros no caminho /v1/tipos-instrumentos-cobranca.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_tipos_instrumentos_cobranca_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-instrumentos-cobranca/{id}`
- Descrição: Consulta dados públicos de tipos de instrumentos de cobrança; ação obter registro no caminho /v1/tipos-instrumentos-cobranca/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_tipos_instrumentos_convocatorios`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-instrumentos-convocatorios`
- Descrição: Consulta dados públicos de tipos de instrumentos convocatórios; ação listar registros no caminho /v1/tipos-instrumentos-convocatorios.

### Parâmetros
- `statusAtivo` (`query`, opcional): schema: {"type":"boolean"}; descrição: 

## `pncp_obter_tipos_instrumentos_convocatorios_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-instrumentos-convocatorios/{id}`
- Descrição: Consulta dados públicos de tipos de instrumentos convocatórios; ação obter registro no caminho /v1/tipos-instrumentos-convocatorios/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## `pncp_listar_tipos_parte_envolvida`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-parte-envolvida`
- Descrição: Consulta dados públicos de tipos de parte envolvida; ação obter tipos parte envolvida no caminho /v1/tipos-parte-envolvida.

### Parâmetros

## `pncp_obter_tipos_parte_envolvida_por_id`

- Provedor: `pncp`
- Endpoint: `GET /v1/tipos-parte-envolvida/{id}`
- Descrição: Consulta dados públicos de tipos de parte envolvida; ação consultar tipo parte envolvida no caminho /v1/tipos-parte-envolvida/{id}.

### Parâmetros
- `id` (`path`, obrigatório): schema: {"format":"int64","type":"integer"}; descrição: 

## Ferramentas semânticas e diagnóstico

Ferramentas compostas e de diagnóstico que realizam somente consultas de leitura nas fontes oficiais.

### `listar_capacidades_mcp`

- Descrição: Lista as fontes, domínios, cobertura, quantidade de ferramentas atômicas e versão do catálogo MCP.
- Argumentos principais: nenhum.
- Comportamento somente leitura: consulta metadados carregados do manifesto e não faz alterações nas fontes ou no catálogo.

### `verificar_saude_fontes`

- Descrição: Executa probes públicos leves e informa se as fontes Compras.gov.br e PNCP estão operacionais ou indisponíveis.
- Argumentos principais: nenhum.
- Comportamento somente leitura: faz apenas requisições GET catalogadas para `/modulo-indicadores/1_consultarIndicadoresConsolidados` e `/v1/modalidades`.

### `pncp_obter_contratacao_completa`

- Descrição: Consulta, em conjunto, os recursos públicos relacionados a uma contratação no PNCP.
- Argumentos principais: `cnpj` (string), `ano` (inteiro) e `sequencial_contratacao` (inteiro).
- Comportamento somente leitura: agrega consultas GET dos recursos da contratação e não cria, altera ou exclui dados.

### `pncp_obter_ata_completa`

- Descrição: Consulta, em conjunto, os recursos públicos relacionados a uma ata de registro de preços no PNCP.
- Argumentos principais: `cnpj` (string), `ano` (inteiro), `sequencial_contratacao` (inteiro) e `sequencial_ata` (inteiro).
- Comportamento somente leitura: agrega consultas GET dos recursos da ata e não cria, altera ou exclui dados.

### `pncp_obter_contrato_completo`

- Descrição: Consulta, em conjunto, os recursos públicos relacionados a um contrato no PNCP.
- Argumentos principais: `cnpj` (string), `ano` (inteiro) e `sequencial_contrato` (inteiro).
- Comportamento somente leitura: agrega consultas GET dos recursos do contrato e não cria, altera ou exclui dados.

### `buscar_compras_publicas`

- Descrição: Pesquisa compras públicas nas fontes catalogadas, no Compras.gov.br, no PNCP ou em ambas.
- Argumentos principais: `texto` (string), `orgao`, `uasg`, `cnpj`, `modalidade`, `data_inicio`, `data_fim`, `codigo_material`, `codigo_servico` e `fonte` (`compras`, `pncp` ou `todas`).
- Comportamento somente leitura: executa apenas consultas GET catalogadas, sem deduplicar ou modificar resultados, registros ou fontes.

### `pncp_buscar_contratacao_por_numero_ano_uasg`

- Descrição: Localiza os identificadores PNCP de uma contratação (CNPJ do órgão, ano e sequencial) a partir do número da contratação, ano e UASG, por exemplo Pregão Eletrônico 90010/2025 na UASG 200350.
- Argumentos principais: `numero` (string, aceita `90010` ou `90010/2025`), `ano` (inteiro), `uasg` (string de 6 dígitos), `modalidade`, `data_inicio`, `data_fim` e `limite_resultados` (opcionais).
- Comportamento somente leitura: consulta apenas os endpoints GET catalogados do Compras.gov.br e não cria, altera ou exclui dados.

### `pncp_listar_documentos_contratacao_por_numero_ano_uasg`

- Descrição: Lista os documentos públicos de uma contratação do PNCP — ETP, Termo de Referência, Edital e anexos — a partir do número da contratação, ano e UASG, com tipo, título, url e sequencial_documento para download.
- Argumentos principais: `numero` (string, aceita `90010` ou `90010/2025`), `ano` (inteiro), `uasg` (string de 6 dígitos), `tipo_documento` (nome do tipo, por exemplo `Edital`), `modalidade`, `data_inicio`, `data_fim` e `limite_resultados` (opcionais).
- Comportamento somente leitura: resolve os identificadores PNCP via Compras.gov.br e lista documentos apenas pelo endpoint GET catalogado de arquivos da contratação, sem baixar conteúdo nem alterar dados.

### `pncp_listar_arps_contratacao_por_numero_ano_uasg`

- Descrição: Lista as Atas de Registro de Preços (ARPs) vinculadas a uma contratação do PNCP a partir do número da contratação, ano e UASG, distinguindo contratação sem atas de contratação não localizada.
- Argumentos principais: `numero` (string, aceita `90010` ou `90010/2025`), `ano` (inteiro), `uasg` (string de 6 dígitos), `modalidade`, `data_inicio`, `data_fim` e `limite_resultados` (opcionais).
- Comportamento somente leitura: resolve os identificadores PNCP via Compras.gov.br e lista atas apenas pelo endpoint GET catalogado de atas da contratação, sem criar, alterar ou excluir dados.
