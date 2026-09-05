# Tools

Tools atômicas geradas a partir do manifesto.

## `compras_listar_modulo_arp_1_1_consultar_arp_id`

- Provider: `compras`
- Endpoint: `GET /modulo-arp/1.1_consultarARP_Id`
- Description: Consulta dados públicos de atas de registro de preços; ação consultar arp id no caminho /modulo-arp/1.1_consultarARP_Id.

### Parameters
- `numeroControlePncpAta` (`query`, required): schema: {"type":"string"}; description: 
- `dataAtualizacao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_arp_1_2_consultar_arp_fim_vigencia`

- Provider: `compras`
- Endpoint: `GET /modulo-arp/1.2_consultarARP_FimVigencia`
- Description: Consulta dados públicos de atas de registro de preços; ação consultar arp fim vigencia no caminho /modulo-arp/1.2_consultarARP_FimVigencia.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoUnidadeGerenciadora` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoModalidadeCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `numeroAtaRegistroPreco` (`query`, optional): schema: {"type":"string"}; description: 
- `dataVigenciaFinalMin` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataVigenciaFinalMax` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataAssinaturaInicial` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataAssinaturaFinal` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_arp_1_consultar_arp`

- Provider: `compras`
- Endpoint: `GET /modulo-arp/1_consultarARP`
- Description: Consulta dados públicos de atas de registro de preços; ação consultar arp no caminho /modulo-arp/1_consultarARP.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoUnidadeGerenciadora` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoModalidadeCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `numeroAtaRegistroPreco` (`query`, optional): schema: {"type":"string"}; description: 
- `dataVigenciaInicialMin` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataVigenciaInicialMax` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataAssinaturaInicial` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataAssinaturaFinal` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_arp_2_1_consultar_arpitem_id`

- Provider: `compras`
- Endpoint: `GET /modulo-arp/2.1_consultarARPItem_Id`
- Description: Consulta dados públicos de atas de registro de preços; ação consultar arpitem id no caminho /modulo-arp/2.1_consultarARPItem_Id.

### Parameters
- `numeroControlePncpAta` (`query`, required): schema: {"type":"string"}; description: 
- `dataAtualizacao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_arp_2_consultar_arpitem`

- Provider: `compras`
- Endpoint: `GET /modulo-arp/2_consultarARPItem`
- Description: Consulta dados públicos de atas de registro de preços; ação consultar arpitem no caminho /modulo-arp/2_consultarARPItem.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoUnidadeGerenciadora` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `codigoModalidadeCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `dataVigenciaInicialMin` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataVigenciaInicialMax` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataAssinaturaInicial` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataAssinaturaFinal` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `numeroItem` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoItem` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `tipoItem` (`query`, optional): schema: {"type":"string"}; description: 
- `niFornecedor` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoPdm` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `numeroCompra` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_arp_3_consultar_unidades_item`

- Provider: `compras`
- Endpoint: `GET /modulo-arp/3_consultarUnidadesItem`
- Description: Consulta dados públicos de atas de registro de preços; ação consultar unidades item no caminho /modulo-arp/3_consultarUnidadesItem.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `numeroAta` (`query`, required): schema: {"type":"string"}; description: 
- `unidadeGerenciadora` (`query`, required): schema: {"type":"string"}; description: 
- `numeroItem` (`query`, required): schema: {"type":"string"}; description: 
- `dataAtualizacao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_arp_4_consultar_empenhos_saldo_item`

- Provider: `compras`
- Endpoint: `GET /modulo-arp/4_consultarEmpenhosSaldoItem`
- Description: Consulta dados públicos de atas de registro de preços; ação consultar empenhos item no caminho /modulo-arp/4_consultarEmpenhosSaldoItem.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `numeroAta` (`query`, required): schema: {"type":"string"}; description: 
- `unidadeGerenciadora` (`query`, required): schema: {"type":"string"}; description: 
- `dataAtualizacao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_arp_5_consultar_adesoes_item`

- Provider: `compras`
- Endpoint: `GET /modulo-arp/5_consultarAdesoesItem`
- Description: Consulta dados públicos de atas de registro de preços; ação consultar adesoes item no caminho /modulo-arp/5_consultarAdesoesItem.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `numeroAta` (`query`, required): schema: {"type":"string"}; description: 
- `unidadeGerenciadora` (`query`, required): schema: {"type":"string"}; description: 
- `numeroItem` (`query`, required): schema: {"type":"string"}; description: 
- `unidade` (`query`, optional): schema: {"type":"string"}; description: 
- `dataAtualizacao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_contratacoes_1_1_consultar_contratacoes_pncp_14133_id`

- Provider: `compras`
- Endpoint: `GET /modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id`
- Description: Consulta dados públicos de contratações públicas; ação consultar contratacoes pncp 14133 id no caminho /modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id.

### Parameters
- `tipo` (`query`, required): schema: {"enum":["idCompra","numeroControlePNCPCompra"],"type":"string"}; description: 
- `codigo` (`query`, required): schema: {"type":"string"}; description: 
- `dataAtualizacaoPncp` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_contratacoes_1_consultar_contratacoes_pncp_14133`

- Provider: `compras`
- Endpoint: `GET /modulo-contratacoes/1_consultarContratacoes_PNCP_14133`
- Description: Consulta dados públicos de contratações públicas; ação consultar contratacoes pncp no caminho /modulo-contratacoes/1_consultarContratacoes_PNCP_14133.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `unidadeOrgaoCodigoUnidade` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoOrgao` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `orgaoEntidadeCnpj` (`query`, optional): schema: {"type":"string"}; description: 
- `dataPublicacaoPncpInicial` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataPublicacaoPncpFinal` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `codigoModalidade` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `unidadeOrgaoCodigoIbge` (`query`, optional): schema: {"type":"integer"}; description: 
- `unidadeOrgaoUfSigla` (`query`, optional): schema: {"type":"string"}; description: 
- `dataAualizacaoPncp` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `amparoLegalCodigoPncp` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `contratacaoExcluida` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_contratacoes_2_1_consultar_itens_contratacoes_pncp_14133_id`

- Provider: `compras`
- Endpoint: `GET /modulo-contratacoes/2.1_consultarItensContratacoes_PNCP_14133_Id`
- Description: Consulta dados públicos de contratações públicas; ação consultar itens contratacoes pncp 14133 id no caminho /modulo-contratacoes/2.1_consultarItensContratacoes_PNCP_14133_Id.

### Parameters
- `tipo` (`query`, required): schema: {"enum":["idCompra","numeroControlePNCPCompra"],"type":"string"}; description: 
- `codigo` (`query`, required): schema: {"type":"string"}; description: 
- `idCompraItem` (`query`, optional): schema: {"type":"string"}; description: 
- `dataAtualizacaoPncp` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_contratacoes_2_consultar_itens_contratacoes_pncp_14133`

- Provider: `compras`
- Endpoint: `GET /modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133`
- Description: Consulta dados públicos de contratações públicas; ação consultar itens contratacoes pncp no caminho /modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `unidadeOrgaoCodigoUnidade` (`query`, optional): schema: {"type":"string"}; description: 
- `orgaoEntidadeCnpj` (`query`, optional): schema: {"type":"string"}; description: 
- `situacaoCompraItem` (`query`, optional): schema: {"type":"string"}; description: 
- `materialOuServico` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `codigoGrupo` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `codItemCatalogo` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `temResultado` (`query`, optional): schema: {"type":"boolean"}; description: 
- `codFornecedor` (`query`, optional): schema: {"type":"string"}; description: 
- `dataInclusaoPncpInicial` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataInclusaoPncpFinal` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataAtualizacaoPncp` (`query`, optional): schema: {"type":"string"}; description: 
- `bps` (`query`, optional): schema: {"default":false,"type":"boolean"}; description: 
- `margemPreferenciaNormal` (`query`, optional): schema: {"type":"boolean"}; description: 
- `codigoNCM` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoPdm` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_contratacoes_3_1_consultar_resultado_itens_contratacoes_pncp_14133_id`

- Provider: `compras`
- Endpoint: `GET /modulo-contratacoes/3.1_consultarResultadoItensContratacoes_PNCP_14133_Id`
- Description: Consulta dados públicos de contratações públicas; ação consultar resultado itens contratacoes pncp 14133 id no caminho /modulo-contratacoes/3.1_consultarResultadoItensContratacoes_PNCP_14133_Id.

### Parameters
- `tipo` (`query`, required): schema: {"enum":["idCompra","numeroControlePNCPCompra"],"type":"string"}; description: 
- `codigo` (`query`, required): schema: {"type":"string"}; description: 
- `idCompraItem` (`query`, optional): schema: {"type":"string"}; description: 
- `dataAtualizacaoPncp` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_contratacoes_3_consultar_resultado_itens_contratacoes_pncp_14133`

- Provider: `compras`
- Endpoint: `GET /modulo-contratacoes/3_consultarResultadoItensContratacoes_PNCP_14133`
- Description: Consulta dados públicos de contratações públicas; ação consultar resultado itens contratacoes pncp no caminho /modulo-contratacoes/3_consultarResultadoItensContratacoes_PNCP_14133.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `unidadeOrgaoCodigoUnidade` (`query`, optional): schema: {"type":"string"}; description: 
- `orgaoEntidadeCnpj` (`query`, optional): schema: {"type":"string"}; description: 
- `niFornecedor` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoPais` (`query`, optional): schema: {"type":"string"}; description: 
- `porteFornecedorId` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `naturezaJuridicaId` (`query`, optional): schema: {"type":"string"}; description: 
- `situacaoCompraItemResultadoId` (`query`, optional): schema: {"type":"integer"}; description: 
- `valorUnitarioHomologadoInicial` (`query`, optional): schema: {"type":"number"}; description: 
- `valorUnitarioHomologadoFinal` (`query`, optional): schema: {"type":"number"}; description: 
- `valorTotalHomologadoInicial` (`query`, optional): schema: {"type":"number"}; description: 
- `valorTotalHomologadoFinal` (`query`, optional): schema: {"type":"number"}; description: 
- `dataResultadoPncpInicial` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataResultadoPncpFinal` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `aplicacaoMargemPreferencia` (`query`, optional): schema: {"type":"boolean"}; description: 
- `aplicacaoBeneficioMeepp` (`query`, optional): schema: {"type":"boolean"}; description: 
- `aplicacaoCriterioDesempate` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_contratos_1_1_consultar_contratos_id`

- Provider: `compras`
- Endpoint: `GET /modulo-contratos/1.1_consultarContratos_Id`
- Description: Consulta dados públicos de contratos públicos; ação consultar contratos id no caminho /modulo-contratos/1.1_consultarContratos_Id.

### Parameters
- `codigo` (`query`, required): schema: {"type":"string"}; description: 
- `tipo` (`query`, required): schema: {"enum":["idCompra","numeroControlePncpContrato"],"type":"string"}; description: 

## `compras_listar_modulo_contratos_1_2_consultar_contratos_fim_vigencia`

- Provider: `compras`
- Endpoint: `GET /modulo-contratos/1.2_consultarContratos_FimVigencia`
- Description: Consulta dados públicos de contratos públicos; ação consultar contratos fim vigencia no caminho /modulo-contratos/1.2_consultarContratos_FimVigencia.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoOrgao` (`query`, required): schema: {"type":"string"}; description: 
- `codigoUnidadeGestora` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoUnidadeGestoraOrigemContrato` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoUnidadeRealizadoraCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `numeroContrato` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoModalidadeCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoTipo` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoCategoria` (`query`, optional): schema: {"type":"string"}; description: 
- `niFornecedor` (`query`, optional): schema: {"type":"string"}; description: 
- `dataVigenciaFinalMin` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataVigenciaFinalMax` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_contratos_1_consultar_contratos`

- Provider: `compras`
- Endpoint: `GET /modulo-contratos/1_consultarContratos`
- Description: Consulta dados públicos de contratos públicos; ação consultar contratos no caminho /modulo-contratos/1_consultarContratos.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoOrgao` (`query`, required): schema: {"type":"string"}; description: 
- `codigoUnidadeGestora` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoUnidadeGestoraOrigemContrato` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoUnidadeRealizadoraCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `numeroContrato` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoModalidadeCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoTipo` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoCategoria` (`query`, optional): schema: {"type":"string"}; description: 
- `niFornecedor` (`query`, optional): schema: {"type":"string"}; description: 
- `dataVigenciaInicialMin` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataVigenciaInicialMax` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_contratos_2_1_consultar_contratos_item_id`

- Provider: `compras`
- Endpoint: `GET /modulo-contratos/2.1_consultarContratosItem_Id`
- Description: Consulta dados públicos de contratos públicos; ação consultar contratos item id no caminho /modulo-contratos/2.1_consultarContratosItem_Id.

### Parameters
- `tipo` (`query`, required): schema: {"enum":["idCompra","numeroControlePncpContrato"],"type":"string"}; description: 
- `codigo` (`query`, required): schema: {"type":"string"}; description: 

## `compras_listar_modulo_contratos_2_consultar_contratos_item`

- Provider: `compras`
- Endpoint: `GET /modulo-contratos/2_consultarContratosItem`
- Description: Consulta dados públicos de contratos públicos; ação consultar contratos item no caminho /modulo-contratos/2_consultarContratosItem.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoOrgao` (`query`, required): schema: {"type":"string"}; description: 
- `codigoUnidadeGestora` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoUnidadeGestoraOrigemContrato` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoUnidadeRealizadoraCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `numeroContrato` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoModalidadeCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `tipoItem` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoItem` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `niFornecedor` (`query`, optional): schema: {"type":"string"}; description: 
- `dataVigenciaInicialMin` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataVigenciaInicialMax` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `poder` (`query`, optional): schema: {"enum":["Executivo","Legislativo","Judiciário"],"type":"string"}; description: 
- `esfera` (`query`, optional): schema: {"enum":["Federal","Estadual","Municipal"],"type":"string"}; description: 
- `idCompra` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_fornecedor_1_consultar_fornecedor`

- Provider: `compras`
- Endpoint: `GET /modulo-fornecedor/1_consultarFornecedor`
- Description: Consulta dados públicos de fornecedores; ação consultar fornecedor no caminho /modulo-fornecedor/1_consultarFornecedor.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `cnpj` (`query`, optional): schema: {"type":"string"}; description: 
- `cpf` (`query`, optional): schema: {"type":"string"}; description: 
- `naturezaJuridicaId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `porteEmpresaId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoCnae` (`query`, optional): schema: {"type":"integer"}; description: 
- `ativo` (`query`, required): schema: {"type":"boolean"}; description: 

## `compras_consultar_indicadores_consolidados`

- Provider: `compras`
- Endpoint: `GET /modulo-indicadores/1_consultarIndicadoresConsolidados`
- Description: Consulta dados públicos de indicadores de compras públicas; ação consultar indicadores consolidados no caminho /modulo-indicadores/1_consultarIndicadoresConsolidados.

### Parameters

## `compras_listar_modulo_indicadores_2_consultar_indicadores_por_periodo`

- Provider: `compras`
- Endpoint: `GET /modulo-indicadores/2_consultarIndicadoresPorPeriodo`
- Description: Consulta dados públicos de indicadores de compras públicas; ação consultar indicadores por periodo no caminho /modulo-indicadores/2_consultarIndicadoresPorPeriodo.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `ano` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `mes` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 

## `compras_listar_modulo_legado_1_1_consultar_licitacao_id`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/1.1_consultarLicitacao_Id`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar licitacao id no caminho /modulo-legado/1.1_consultarLicitacao_Id.

### Parameters
- `id_compra` (`query`, required): schema: {"type":"string"}; description: 
- `dt_alteracao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_legado_1_consultar_licitacao`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/1_consultarLicitacao`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar licitacao no caminho /modulo-legado/1_consultarLicitacao.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `uasg` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `numero_aviso` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `modalidade` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `data_publicacao_inicial` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `data_publicacao_final` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `pertence14133` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_legado_2_1_consultar_item_licitacao_id`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/2.1_consultarItemLicitacao_Id`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar item licitacao id no caminho /modulo-legado/2.1_consultarItemLicitacao_Id.

### Parameters
- `id_compra` (`query`, required): schema: {"type":"string"}; description: 
- `id_compra_item` (`query`, optional): schema: {"type":"string"}; description: 
- `dt_alteracao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_legado_2_consultar_item_licitacao`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/2_consultarItemLicitacao`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar item licitacao no caminho /modulo-legado/2_consultarItemLicitacao.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `uasg` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `numero_aviso` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `modalidade` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `decreto_7174` (`query`, optional): schema: {"type":"boolean"}; description: 
- `codigo_item_material` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `codigo_item_servico` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `cnpj_fornecedor` (`query`, optional): schema: {"type":"string"}; description: 
- `cpfVencedor` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_legado_3_1_consultar_pregoes_id`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/3.1_consultarPregoes_Id`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar pregoes id no caminho /modulo-legado/3.1_consultarPregoes_Id.

### Parameters
- `id_compra` (`query`, required): schema: {"type":"string"}; description: 
- `dt_alteracao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_legado_3_consultar_pregoes`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/3_consultarPregoes`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar pregoes no caminho /modulo-legado/3_consultarPregoes.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `co_uasg` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `co_orgao` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `numero` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `ds_tipo_pregao_compra` (`query`, optional): schema: {"type":"string"}; description: 
- `dt_data_edital_inicial` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dt_data_edital_final` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `pertence14133` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_legado_4_1_consultar_itens_pregoes_id`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/4.1_consultarItensPregoes_Id`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar itens pregoes id no caminho /modulo-legado/4.1_consultarItensPregoes_Id.

### Parameters
- `id_compra` (`query`, required): schema: {"type":"string"}; description: 
- `id_compra_item` (`query`, optional): schema: {"type":"string"}; description: 
- `dt_alteracao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_legado_4_consultar_itens_pregoes`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/4_consultarItensPregoes`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar itens pregoes no caminho /modulo-legado/4_consultarItensPregoes.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `co_uasg` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `decreto_7174` (`query`, optional): schema: {"type":"string"}; description: 
- `fornecedor_vencedor` (`query`, optional): schema: {"type":"string"}; description: 
- `dt_hom_inicial` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dt_hom_final` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_legado_5_1_consultar_compra_sem_licitacao_id`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/5.1_consultarCompraSemLicitacao_Id`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar compra sem licitacao id no caminho /modulo-legado/5.1_consultarCompraSemLicitacao_Id.

### Parameters
- `idCompra` (`query`, required): schema: {"type":"string"}; description: 

## `compras_listar_modulo_legado_5_consultar_compras_sem_licitacao`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/5_consultarComprasSemLicitacao`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar compras sem licitacao no caminho /modulo-legado/5_consultarComprasSemLicitacao.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `dt_ano_aviso` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `nu_aviso_licitacao` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `co_modalidade_licitacao` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `co_orgao` (`query`, optional): schema: {"type":"string"}; description: 
- `co_orgao_superior` (`query`, optional): schema: {"type":"string"}; description: 
- `co_uasg` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `dtDeclaracaoDispensaInicial` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dtDeclaracaoDispensaFinal` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dtRatificacao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dtPublicacao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `pertence14133` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_legado_6_1_consultar_itens_compras_sem_licitacao_id`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/6.1_consultarItensComprasSemLicitacao_Id`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar itens compras sem licitacao id no caminho /modulo-legado/6.1_consultarItensComprasSemLicitacao_Id.

### Parameters
- `id_compra` (`query`, required): schema: {"type":"string"}; description: 
- `id_compra_item` (`query`, optional): schema: {"type":"string"}; description: 
- `dt_alteracao` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_legado_6_consultar_compra_itens_sem_licitacao`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/6_consultarCompraItensSemLicitacao`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar compra itens sem licitacao no caminho /modulo-legado/6_consultarCompraItensSemLicitacao.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `co_uasg` (`query`, optional): schema: {"type":"integer"}; description: 
- `co_orgao` (`query`, optional): schema: {"type":"string"}; description: 
- `dt_ano_aviso_licitacao` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `co_modalidade_licitacao` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `co_conjunto_materiais` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `co_servico` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `nu_cpf_cnpj_fornecedor` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_legado_7_consultar_rdc`

- Provider: `compras`
- Endpoint: `GET /modulo-legado/7_consultarRdc`
- Description: Consulta dados públicos de licitações e compras legadas; ação consultar rdc no caminho /modulo-legado/7_consultarRdc.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `data_publicacao_min` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `data_publicacao_max` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `endereco_entrega_edital` (`query`, optional): schema: {"type":"string"}; description: 
- `forma_de_realizacao` (`query`, optional): schema: {"type":"string"}; description: 
- `funcao_responsavel` (`query`, optional): schema: {"type":"string"}; description: 
- `modalidade` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `nome_responsavel` (`query`, optional): schema: {"type":"string"}; description: 
- `numero_aviso` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `objeto` (`query`, optional): schema: {"type":"string"}; description: 
- `orgao` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `situacao_aviso` (`query`, optional): schema: {"type":"string"}; description: 
- `uasg` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `uf_uasg` (`query`, optional): schema: {"type":"string"}; description: 
- `valor_estimado_total_max` (`query`, optional): schema: {"type":"number"}; description: 
- `valor_estimado_total_min` (`query`, optional): schema: {"type":"number"}; description: 
- `valor_homologado_total_max` (`query`, optional): schema: {"type":"number"}; description: 
- `valor_homologado_total_min` (`query`, optional): schema: {"type":"number"}; description: 

## `compras_listar_modulo_material_1_consultar_grupo_material`

- Provider: `compras`
- Endpoint: `GET /modulo-material/1_consultarGrupoMaterial`
- Description: Consulta dados públicos de materiais para compras públicas; ação consultar grupo material no caminho /modulo-material/1_consultarGrupoMaterial.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoGrupo` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusGrupo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_material_2_consultar_classe_material`

- Provider: `compras`
- Endpoint: `GET /modulo-material/2_consultarClasseMaterial`
- Description: Consulta dados públicos de materiais para compras públicas; ação consultar classe material no caminho /modulo-material/2_consultarClasseMaterial.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoGrupo` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusClasse` (`query`, optional): schema: {"type":"boolean"}; description: 
- `bps` (`query`, optional): schema: {"default":false,"type":"boolean"}; description: 

## `compras_listar_modulo_material_3_consultar_pdm_material`

- Provider: `compras`
- Endpoint: `GET /modulo-material/3_consultarPdmMaterial`
- Description: Consulta dados públicos de materiais para compras públicas; ação consultar pdm material no caminho /modulo-material/3_consultarPdmMaterial.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `statusPdm` (`query`, optional): schema: {"type":"boolean"}; description: 
- `codigoPdm` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoGrupo` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `bps` (`query`, optional): schema: {"default":false,"type":"boolean"}; description: 

## `compras_listar_modulo_material_4_consultar_item_material`

- Provider: `compras`
- Endpoint: `GET /modulo-material/4_consultarItemMaterial`
- Description: Consulta dados públicos de materiais para compras públicas; ação consultar item material no caminho /modulo-material/4_consultarItemMaterial.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoItem` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoGrupo` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoPdm` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `descricaoItem` (`query`, optional): schema: {"type":"string"}; description: 
- `statusItem` (`query`, optional): schema: {"type":"boolean"}; description: 
- `bps` (`query`, optional): schema: {"default":false,"type":"boolean"}; description: 
- `codigo_ncm` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_material_5_consultar_material_natureza_despesa`

- Provider: `compras`
- Endpoint: `GET /modulo-material/5_consultarMaterialNaturezaDespesa`
- Description: Consulta dados públicos de materiais para compras públicas; ação consultar material natureza despesa no caminho /modulo-material/5_consultarMaterialNaturezaDespesa.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoPdm` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoNaturezaDespesa` (`query`, optional): schema: {"type":"string"}; description: 
- `statusNaturezaDespesa` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_material_6_consultar_material_unidade_fornecimento`

- Provider: `compras`
- Endpoint: `GET /modulo-material/6_consultarMaterialUnidadeFornecimento`
- Description: Consulta dados públicos de materiais para compras públicas; ação consultar material unidade fornecimento no caminho /modulo-material/6_consultarMaterialUnidadeFornecimento.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoPdm` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusUnidadeFornecimentoPdm` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_material_7_consultar_material_caracteristicas`

- Provider: `compras`
- Endpoint: `GET /modulo-material/7_consultarMaterialCaracteristicas`
- Description: Consulta dados públicos de materiais para compras públicas; ação consultar material caracteristicas no caminho /modulo-material/7_consultarMaterialCaracteristicas.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoItem` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 

## `compras_listar_modulo_ocds_1_releases`

- Provider: `compras`
- Endpoint: `GET /modulo-ocds/1_releases`
- Description: Consulta dados públicos de dados de contratações no padrão OCDS; ação listar releases no caminho /modulo-ocds/1_releases.

### Parameters
- `page` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `offSet` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `buyerID` (`query`, required): schema: {"description":"BR-CNPJ","type":"string"}; description: BR-CNPJ
- `releaseStartDate` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `releaseEndDate` (`query`, required): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_1_1_consultar_material_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/1.1_consultarMaterial_CSV`
- Description: Consulta dados públicos de pesquisa de preços; ação consultar material csv no caminho /modulo-pesquisa-preco/1.1_consultarMaterial_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `tipo` (`query`, required): schema: {"enum":["codigoItemCatalogo","codigoPdm"],"type":"string"}; description: 
- `codigo` (`query`, required): schema: {"type":"string"}; description: 
- `codigoUasg` (`query`, optional): schema: {"type":"string"}; description: 
- `estado` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoMunicipio` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `dataResultado` (`query`, optional): schema: {"default":false,"type":"boolean"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `poder` (`query`, optional): schema: {"type":"string"}; description: 
- `esfera` (`query`, optional): schema: {"type":"string"}; description: 
- `idCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `dataCompraInicio` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataCompraFim` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_1_consultar_material`

- Provider: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/1_consultarMaterial`
- Description: Consulta dados públicos de pesquisa de preços; ação consultar material no caminho /modulo-pesquisa-preco/1_consultarMaterial.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `tipo` (`query`, required): schema: {"enum":["codigoItemCatalogo","codigoPdm"],"type":"string"}; description: 
- `codigo` (`query`, required): schema: {"type":"string"}; description: 
- `codigoUasg` (`query`, optional): schema: {"type":"string"}; description: 
- `estado` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoMunicipio` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `dataResultado` (`query`, optional): schema: {"default":false,"type":"boolean"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `poder` (`query`, optional): schema: {"type":"string"}; description: 
- `esfera` (`query`, optional): schema: {"type":"string"}; description: 
- `idCompra` (`query`, optional): schema: {"type":"string"}; description: 
- `dataCompraInicio` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataCompraFim` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_2_1_consultar_material_detalhe_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/2.1_consultarMaterialDetalhe_CSV`
- Description: Consulta dados públicos de pesquisa de preços; ação consultar material detalhe csv no caminho /modulo-pesquisa-preco/2.1_consultarMaterialDetalhe_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoItemCatalogo` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `dataCompraInicio` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataCompraFim` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_2_consultar_material_detalhe`

- Provider: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/2_consultarMaterialDetalhe`
- Description: Consulta dados públicos de pesquisa de preços; ação consultar material detalhe no caminho /modulo-pesquisa-preco/2_consultarMaterialDetalhe.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoItemCatalogo` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `dataCompraInicio` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataCompraFim` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_3_1_consultar_servico_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/3.1_consultarServico_CSV`
- Description: Consulta dados públicos de pesquisa de preços; ação consultar servico csv no caminho /modulo-pesquisa-preco/3.1_consultarServico_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoItemCatalogo` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `codigoUasg` (`query`, optional): schema: {"type":"string"}; description: 
- `estado` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoMunicipio` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `dataResultado` (`query`, optional): schema: {"default":false,"type":"boolean"}; description: 
- `poder` (`query`, optional): schema: {"type":"string"}; description: 
- `esfera` (`query`, optional): schema: {"type":"string"}; description: 
- `dataCompraInicio` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataCompraFim` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `idCompra` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_pesquisa_preco_3_consultar_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/3_consultarServico`
- Description: Consulta dados públicos de pesquisa de preços; ação consultar servico no caminho /modulo-pesquisa-preco/3_consultarServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoItemCatalogo` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `codigoUasg` (`query`, optional): schema: {"type":"string"}; description: 
- `estado` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoMunicipio` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `dataResultado` (`query`, optional): schema: {"default":false,"type":"boolean"}; description: 
- `poder` (`query`, optional): schema: {"type":"string"}; description: 
- `esfera` (`query`, optional): schema: {"type":"string"}; description: 
- `dataCompraInicio` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataCompraFim` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `idCompra` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_pesquisa_preco_4_1_consultar_servico_detalhe_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/4.1_consultarServicoDetalhe_CSV`
- Description: Consulta dados públicos de pesquisa de preços; ação consultar servico detalhe csv no caminho /modulo-pesquisa-preco/4.1_consultarServicoDetalhe_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoItemCatalogo` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `dataCompraInicio` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataCompraFim` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_pesquisa_preco_4_consultar_servico_detalhe`

- Provider: `compras`
- Endpoint: `GET /modulo-pesquisa-preco/4_consultarServicoDetalhe`
- Description: Consulta dados públicos de pesquisa de preços; ação consultar servico detalhe no caminho /modulo-pesquisa-preco/4_consultarServicoDetalhe.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoItemCatalogo` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `dataCompraInicio` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD
- `dataCompraFim` (`query`, optional): schema: {"description":"YYYY-MM-DD","type":"string"}; description: YYYY-MM-DD

## `compras_listar_modulo_pgc_1_1_consultar_pgc_detalhe_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-pgc/1.1_consultarPgcDetalhe_CSV`
- Description: Consulta dados públicos de planejamento de contratações; ação consultar pgc detalhe csv no caminho /modulo-pgc/1.1_consultarPgcDetalhe_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `orgao` (`query`, required): schema: {"type":"string"}; description: 
- `anoPcaProjetoCompra` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `codigoUasg` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_pgc_1_consultar_pgc_detalhe`

- Provider: `compras`
- Endpoint: `GET /modulo-pgc/1_consultarPgcDetalhe`
- Description: Consulta dados públicos de planejamento de contratações; ação consultar pgc detalhe no caminho /modulo-pgc/1_consultarPgcDetalhe.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `orgao` (`query`, required): schema: {"type":"string"}; description: 
- `anoPcaProjetoCompra` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `codigoUasg` (`query`, optional): schema: {"type":"string"}; description: 

## `compras_listar_modulo_pgc_2_1_consultar_pgc_detalhe_catalogo_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-pgc/2.1_consultarPgcDetalheCatalogo_CSV`
- Description: Consulta dados públicos de planejamento de contratações; ação consultar pgc detalhe catalogo csv no caminho /modulo-pgc/2.1_consultarPgcDetalheCatalogo_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `anoPcaProjetoCompra` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `tipo` (`query`, required): schema: {"enum":["Servico","Material"],"type":"string"}; description: 
- `codigo` (`query`, required): schema: {"description":"Código de classe para material ou código do grupo para serviço","format":"int32","type":"integer"}; description: Código de classe para material ou código do grupo para serviço

## `compras_listar_modulo_pgc_2_consultar_pgc_detalhe_catalogo`

- Provider: `compras`
- Endpoint: `GET /modulo-pgc/2_consultarPgcDetalheCatalogo`
- Description: Consulta dados públicos de planejamento de contratações; ação consultar pgc detalhe catalogo no caminho /modulo-pgc/2_consultarPgcDetalheCatalogo.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `anoPcaProjetoCompra` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 
- `tipo` (`query`, required): schema: {"enum":["Servico","Material"],"type":"string"}; description: 
- `codigo` (`query`, required): schema: {"description":"Código de classe para material ou código do grupo para serviço","format":"int32","type":"integer"}; description: Código de classe para material ou código do grupo para serviço

## `compras_listar_modulo_pgc_3_1_consultar_pgc_agregacao_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-pgc/3.1_consultarPgcAgregacao_CSV`
- Description: Consulta dados públicos de planejamento de contratações; ação consultar pgc agregacao csv no caminho /modulo-pgc/3.1_consultarPgcAgregacao_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `orgao` (`query`, required): schema: {"type":"string"}; description: 
- `ano` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 

## `compras_listar_modulo_pgc_3_consultar_pgc_agregacao`

- Provider: `compras`
- Endpoint: `GET /modulo-pgc/3_consultarPgcAgregacao`
- Description: Consulta dados públicos de planejamento de contratações; ação consultar pgc agregacao no caminho /modulo-pgc/3_consultarPgcAgregacao.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `orgao` (`query`, required): schema: {"type":"string"}; description: 
- `ano` (`query`, required): schema: {"format":"int32","type":"integer"}; description: 

## `compras_listar_modulo_servico_1_consultar_secao_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-servico/1_consultarSecaoServico`
- Description: Consulta dados públicos de serviços para compras públicas; ação consultar secao servico no caminho /modulo-servico/1_consultarSecaoServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoSecao` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusSecao` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_servico_2_consultar_divisao_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-servico/2_consultarDivisaoServico`
- Description: Consulta dados públicos de serviços para compras públicas; ação consultar divisao servico no caminho /modulo-servico/2_consultarDivisaoServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoSecao` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoDivisao` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusDivisao` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_servico_3_consultar_grupo_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-servico/3_consultarGrupoServico`
- Description: Consulta dados públicos de serviços para compras públicas; ação consultar grupo servico no caminho /modulo-servico/3_consultarGrupoServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoDivisao` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoGrupo` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusGrupo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_servico_4_consultar_classe_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-servico/4_consultarClasseServico`
- Description: Consulta dados públicos de serviços para compras públicas; ação consultar classe servico no caminho /modulo-servico/4_consultarClasseServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoGrupo` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusGrupo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_servico_5_consultar_sub_classe_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-servico/5_consultarSubClasseServico`
- Description: Consulta dados públicos de serviços para compras públicas; ação consultar sub classe servico no caminho /modulo-servico/5_consultarSubClasseServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoSubclasse` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusSubclasse` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_servico_6_consultar_item_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-servico/6_consultarItemServico`
- Description: Consulta dados públicos de serviços para compras públicas; ação consultar item servico no caminho /modulo-servico/6_consultarItemServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","type":"integer"}; description: 
- `codigoSecao` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoDivisao` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoGrupo` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoClasse` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoSubclasse` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoCpc` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoServico` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `exclusivoCentralCompras` (`query`, optional): schema: {"type":"boolean"}; description: 
- `statusServico` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_servico_7_consultar_und_medida_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-servico/7_consultarUndMedidaServico`
- Description: Consulta dados públicos de serviços para compras públicas; ação consultar und medida servico no caminho /modulo-servico/7_consultarUndMedidaServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoServico` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusUnidadeMedida` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_servico_8_consultar_natureza_despesa_servico`

- Provider: `compras`
- Endpoint: `GET /modulo-servico/8_consultarNaturezaDespesaServico`
- Description: Consulta dados públicos de serviços para compras públicas; ação consultar natureza despesa servico no caminho /modulo-servico/8_consultarNaturezaDespesaServico.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoServico` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `codigoNaturezaDespesa` (`query`, optional): schema: {"type":"string"}; description: 
- `statusNaturezaDespesa` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_uasg_1_1_consultar_uasg_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-uasg/1.1_consultarUasg_CSV`
- Description: Consulta dados públicos de órgãos e unidades administrativas; ação consultar uasg csv no caminho /modulo-uasg/1.1_consultarUasg_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoUasg` (`query`, optional): schema: {"type":"string"}; description: 
- `usoSisg` (`query`, optional): schema: {"type":"boolean"}; description: 
- `cnpjCpfOrgao` (`query`, optional): schema: {"type":"string"}; description: 
- `cnpjCpfOrgaoVinculado` (`query`, optional): schema: {"type":"string"}; description: 
- `cnpjCpfOrgaoSuperior` (`query`, optional): schema: {"type":"string"}; description: 
- `siglaUf` (`query`, optional): schema: {"type":"string"}; description: 
- `statusUasg` (`query`, required): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_uasg_1_consultar_uasg`

- Provider: `compras`
- Endpoint: `GET /modulo-uasg/1_consultarUasg`
- Description: Consulta dados públicos de órgãos e unidades administrativas; ação consultar uasg no caminho /modulo-uasg/1_consultarUasg.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `codigoUasg` (`query`, optional): schema: {"type":"string"}; description: 
- `usoSisg` (`query`, optional): schema: {"type":"boolean"}; description: 
- `cnpjCpfOrgao` (`query`, optional): schema: {"type":"string"}; description: 
- `cnpjCpfOrgaoVinculado` (`query`, optional): schema: {"type":"string"}; description: 
- `cnpjCpfOrgaoSuperior` (`query`, optional): schema: {"type":"string"}; description: 
- `siglaUf` (`query`, optional): schema: {"type":"string"}; description: 
- `statusUasg` (`query`, required): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_uasg_2_1_consultar_orgao_csv`

- Provider: `compras`
- Endpoint: `GET /modulo-uasg/2.1_consultarOrgao_CSV`
- Description: Consulta dados públicos de órgãos e unidades administrativas; ação consultar orgao csv no caminho /modulo-uasg/2.1_consultarOrgao_CSV.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `cnpjCpfOrgao` (`query`, optional): schema: {"type":"string"}; description: 
- `cnpjCpfOrgaoVinculado` (`query`, optional): schema: {"type":"string"}; description: 
- `cnpjCpfOrgaoSuperior` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoOrgao` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `statusOrgao` (`query`, required): schema: {"type":"boolean"}; description: 
- `usoSisg` (`query`, optional): schema: {"type":"boolean"}; description: 

## `compras_listar_modulo_uasg_2_consultar_orgao`

- Provider: `compras`
- Endpoint: `GET /modulo-uasg/2_consultarOrgao`
- Description: Consulta dados públicos de órgãos e unidades administrativas; ação consultar orgao no caminho /modulo-uasg/2_consultarOrgao.

### Parameters
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","type":"integer"}; description: 
- `cnpjCpfOrgao` (`query`, optional): schema: {"type":"string"}; description: 
- `cnpjCpfOrgaoVinculado` (`query`, optional): schema: {"type":"string"}; description: 
- `cnpjCpfOrgaoSuperior` (`query`, optional): schema: {"type":"string"}; description: 
- `codigoOrgao` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `statusOrgao` (`query`, required): schema: {"type":"boolean"}; description: 
- `usoSisg` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_listar_amparos_legais`

- Provider: `pncp`
- Endpoint: `GET /v1/amparos-legais`
- Description: Consulta dados públicos de amparos legais; ação listar registros no caminho /v1/amparos-legais.

### Parameters
- `tipoAmparoLegalId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_amparos_legais_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/amparos-legais/{id}`
- Description: Consulta dados públicos de amparos legais; ação obter registro no caminho /v1/amparos-legais/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_catalogos`

- Provider: `pncp`
- Endpoint: `GET /v1/catalogos`
- Description: Consulta dados públicos de catálogos de itens; ação listar registros no caminho /v1/catalogos.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_catalogos_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/catalogos/{id}`
- Description: Consulta dados públicos de catálogos de itens; ação obter registro no caminho /v1/catalogos/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_categoria_item_pcas`

- Provider: `pncp`
- Endpoint: `GET /v1/categoriaItemPcas`
- Description: Consulta dados públicos de categorias de itens de planos de contratações anuais; ação listar registros no caminho /v1/categoriaItemPcas.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_categoria_item_pcas_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/categoriaItemPcas/{id}`
- Description: Consulta dados públicos de categorias de itens de planos de contratações anuais; ação obter registro no caminho /v1/categoriaItemPcas/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_criterios_julgamentos`

- Provider: `pncp`
- Endpoint: `GET /v1/criterios-julgamentos`
- Description: Consulta dados públicos de critérios de julgamento; ação listar registros no caminho /v1/criterios-julgamentos.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_criterios_julgamentos_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/criterios-julgamentos/{id}`
- Description: Consulta dados públicos de critérios de julgamento; ação obter registro no caminho /v1/criterios-julgamentos/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_fontes_orcamentarias`

- Provider: `pncp`
- Endpoint: `GET /v1/fontes-orcamentarias`
- Description: Consulta dados públicos de fontes orçamentárias; ação listar registros no caminho /v1/fontes-orcamentarias.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_fontes_orcamentarias_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/fontes-orcamentarias/{id}`
- Description: Consulta dados públicos de fontes orçamentárias; ação obter registro no caminho /v1/fontes-orcamentarias/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_instrumento_convocatorio_modalidade_amparo_legal`

- Provider: `pncp`
- Endpoint: `GET /v1/instrumento-convocatorio-modalidade-amparo-legal`
- Description: Consulta dados públicos de instrumentos convocatórios, modalidades e amparos legais; ação consultar no caminho /v1/instrumento-convocatorio-modalidade-amparo-legal.

### Parameters
- `amparoLegalId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `modalidadeId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `tipoInstrumentoConvocatorioId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_obter_instrumento_convocatorio_modalidade_amparo_legal_por_amparolegalid_modalidadeid_tipoinstrumentoconvocatorioid`

- Provider: `pncp`
- Endpoint: `GET /v1/instrumento-convocatorio-modalidade-amparo-legal/{amparoLegalId}/{modalidadeId}/{tipoInstrumentoConvocatorioId}`
- Description: Consulta dados públicos de instrumentos convocatórios, modalidades e amparos legais; ação obter registro no caminho /v1/instrumento-convocatorio-modalidade-amparo-legal/{amparoLegalId}/{modalidadeId}/{tipoInstrumentoConvocatorioId}.

### Parameters
- `amparoLegalId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 
- `modalidadeId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 
- `tipoInstrumentoConvocatorioId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_modalidade_criterio_julgamento`

- Provider: `pncp`
- Endpoint: `GET /v1/modalidade-criterio-julgamento`
- Description: Consulta dados públicos de modalidades e critérios de julgamento; ação obter criterios julgamento por modalidade no caminho /v1/modalidade-criterio-julgamento.

### Parameters
- `modalidadeId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `criterioJulgamentoId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_obter_modalidade_criterio_julgamento_por_modalidadeid_criteriojulgamentoid`

- Provider: `pncp`
- Endpoint: `GET /v1/modalidade-criterio-julgamento/{modalidadeId}/{criterioJulgamentoId}`
- Description: Consulta dados públicos de modalidades e critérios de julgamento; ação obter modalidade criterio julgamento no caminho /v1/modalidade-criterio-julgamento/{modalidadeId}/{criterioJulgamentoId}.

### Parameters
- `modalidadeId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 
- `criterioJulgamentoId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_modalidade_fonte_orcamentaria`

- Provider: `pncp`
- Endpoint: `GET /v1/modalidade-fonte-orcamentaria`
- Description: Consulta dados públicos de modalidades e fontes orçamentárias; ação obter fonte orcamentaria por modalidade no caminho /v1/modalidade-fonte-orcamentaria.

### Parameters
- `modalidadeId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `fonteOrcamentariaId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_obter_modalidade_fonte_orcamentaria_por_modalidadeid_fonteorcamentariaid`

- Provider: `pncp`
- Endpoint: `GET /v1/modalidade-fonte-orcamentaria/{modalidadeId}/{fonteOrcamentariaId}`
- Description: Consulta dados públicos de modalidades e fontes orçamentárias; ação obter modalidade fonte orcamentaria no caminho /v1/modalidade-fonte-orcamentaria/{modalidadeId}/{fonteOrcamentariaId}.

### Parameters
- `modalidadeId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 
- `fonteOrcamentariaId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_modalidades`

- Provider: `pncp`
- Endpoint: `GET /v1/modalidades`
- Description: Consulta dados públicos de modalidades de contratação; ação listar registros no caminho /v1/modalidades.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 
- `irp` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_modalidades_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/modalidades/{id}`
- Description: Consulta dados públicos de modalidades de contratação; ação obter registro no caminho /v1/modalidades/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_modos_disputas`

- Provider: `pncp`
- Endpoint: `GET /v1/modos-disputas`
- Description: Consulta dados públicos de modos de disputa; ação listar registros no caminho /v1/modos-disputas.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_modos_disputas_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/modos-disputas/{id}`
- Description: Consulta dados públicos de modos de disputa; ação obter registro no caminho /v1/modos-disputas/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_orgaos`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/`
- Description: Consulta dados públicos de órgãos e unidades públicas; ação consultar entes por filtro no caminho /v1/orgaos/.

### Parameters
- `razaoSocial` (`query`, required): schema: {"maxLength":2147483647,"minLength":3,"type":"string"}; description: Razão social com pelo menos 3 caracteres
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","minimum":1,"type":"integer"}; description: Índice de paginação iniciando com valor = 1

## `pncp_obter_orgaos_id_por_orgaoid`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/id/{orgaoId}`
- Description: Consulta dados públicos de órgãos e unidades públicas; ação consultar ente no caminho /v1/orgaos/id/{orgaoId}.

### Parameters
- `orgaoId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_obter_orgaos_por_cnpj`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}`
- Description: Consulta dados públicos de órgãos e unidades públicas; ação consultar ente no caminho /v1/orgaos/{cnpj}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 

## `pncp_obter_orgaos_compras_atas_por_cnpj_anocompra_sequencialcompra`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar atas por filtros no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `anoCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":10,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_atas_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar ata registo preco no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `anoCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialAta` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_atas_arquivos_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar informacoes documentos ata no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos.

### Parameters
- `cnpj` (`path`, required): schema: {"maxLength":14,"minLength":14,"type":"string"}; description: 
- `anoCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialAta` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_atas_arquivos_quantidade_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos/quantidade`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar ata documento quantidade no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `anoCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialAta` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_atas_arquivos_por_cnpj_anocompra_sequencialcompra_sequencialata_sequencialdocumento`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos/{sequencialDocumento}`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar arquivo no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/arquivos/{sequencialDocumento}.

### Parameters
- `cnpj` (`path`, required): schema: {"maxLength":14,"minLength":14,"type":"string"}; description: 
- `anoCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialAta` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialDocumento` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_atas_contratos_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/contratos`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar contratos ata registo preco no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/contratos.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: CNPJ da Compra
- `anoCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Ano da Compra
- `sequencialCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Sequencial da Compra
- `sequencialAta` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Sequencial da Ata
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":10,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_atas_partesenvolvidas_por_cnpj_anocompra_sequencialcompra_sequencialata`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/partesenvolvidas`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação buscar no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/partesenvolvidas.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: CNPJ da Compra
- `anoCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Ano da Compra
- `sequencialCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Sequencial da Compra
- `sequencialAta` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Sequencial da Ata
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":10,"type":"integer"}; description: 

## `pncp_obter_parte_envolvida_ata`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/partesenvolvidas/{cnpjOrgao}/{codUnidade}/{tipoParteEnvolvida}`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar parte envolvida ata no caminho /v1/orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/atas/{sequencialAta}/partesenvolvidas/{cnpjOrgao}/{codUnidade}/{tipoParteEnvolvida}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: CNPJ da Compra
- `anoCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Ano da Compra
- `sequencialCompra` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Sequencial da Compra
- `sequencialAta` (`path`, required): schema: {"format":"int32","type":"integer"}; description: Sequencial da Ata
- `cnpjOrgao` (`path`, required): schema: {"type":"string"}; description: CNPJ do orgão da Parte Envolvida
- `codUnidade` (`path`, required): schema: {"type":"string"}; description: Código da unidade da Parte Envolvida
- `tipoParteEnvolvida` (`path`, required): schema: {"format":"int64","type":"integer"}; description: Tipo de parte Envolvida

## `pncp_obter_orgaos_compras_arquivos_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar informacoes documentos compra no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_arquivos_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/quantidade`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar compra documento quantidade no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_arquivos_por_cnpj_ano_sequencial_sequencialdocumento`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/{sequencialDocumento}`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar arquivo no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/arquivos/{sequencialDocumento}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialDocumento` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_atas_historico_por_cnpj_ano_sequencial_sequencialata`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}/historico`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar historico ata no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}/historico.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialAta` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_atas_historico_quantidade_por_cnpj_ano_sequencial_sequencialata`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}/historico/quantidade`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar historico ata quantidade no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/atas/{sequencialAta}/historico/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialAta` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_fonte_orcamentaria_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/fonte-orcamentaria`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação listar registros no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/fonte-orcamentaria.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_fonte_orcamentaria_por_cnpj_ano_sequencial_fonteorcamentariaid`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/fonte-orcamentaria/{fonteOrcamentariaId}`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação obter registro no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/fonte-orcamentaria/{fonteOrcamentariaId}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `fonteOrcamentariaId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_historico_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar compra no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_historico_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico/quantidade`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar quantidade no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/historico/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_itens_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar pesquisar compra item no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_compras_itens_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/quantidade`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar compra item quantidade no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_itens_por_cnpj_ano_sequencial_numeroitem`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar compra item no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `numeroItem` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_itens_imagem_por_cnpj_ano_sequencial_numeroitem`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/imagem`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação obter imagem lista no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/imagem.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `numeroItem` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_itens_imagem_por_cnpj_ano_sequencial_numeroitem_sequencialimagem`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/imagem/{sequencialImagem}`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação obter imagem no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/imagem/{sequencialImagem}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `numeroItem` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialImagem` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_itens_resultados_por_cnpj_ano_sequencial_numeroitem`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar resultados no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `numeroItem` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_compras_itens_resultados_por_cnpj_ano_sequencial_numeroitem_sequencialresultado`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados/{sequencialResultado}`
- Description: Consulta dados públicos de compras públicas, itens, resultados e arquivos; ação consultar resultado no caminho /v1/orgaos/{cnpj}/compras/{ano}/{sequencial}/itens/{numeroItem}/resultados/{sequencialResultado}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `numeroItem` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialResultado` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_contratacao_por_cnpj_anocontratacao_sequencialcontratacao`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/contratacao/{anoContratacao}/{sequencialContratacao}`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar contratos contratacao no caminho /v1/orgaos/{cnpj}/contratos/contratacao/{anoContratacao}/{sequencialContratacao}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `anoContratacao` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialContratacao` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","maximum":50,"minimum":10,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_instrumentocobranca_por_cnpj_ano_sequencialcontrato`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/instrumentocobranca`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar instrumentos cobranca no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/instrumentocobranca.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialContrato` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_instrumentocobranca_por_cnpj_ano_sequencialcontrato_sequencialinstrumentocobranca`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/instrumentocobranca/{sequencialInstrumentoCobranca}`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar instrumento cobranca no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencialContrato}/instrumentocobranca/{sequencialInstrumentoCobranca}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencialContrato` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialInstrumentoCobranca` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_arquivos_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar informacoes documentos contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_arquivos_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos/quantidade`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar contrato documento quantidade no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_arquivos_por_cnpj_ano_sequencial_sequencialdocumento`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos/{sequencialDocumento}`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar arquivo no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/arquivos/{sequencialDocumento}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialDocumento` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_empenhos_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/empenhos`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar empenhos do contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/empenhos.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":10,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_empenhos_por_cnpj_ano_sequencial_sequencialempenho`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/empenhos/{sequencialEmpenho}`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar empenho pelo numero sequencial no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/empenhos/{sequencialEmpenho}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialEmpenho` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_historico_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_historico_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico/quantidade`
- Description: Consulta a quantidade de registros do histórico do contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/historico/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_termos_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar termos contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_termos_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/quantidade`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar quantidade termos contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_termos_por_cnpj_ano_sequencial_sequencialtermocontrato`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermoContrato}`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar termo contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermoContrato}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialTermoContrato` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_termos_arquivos_por_cnpj_ano_sequencial_sequencialtermo`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar informacoes documentos termo contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialTermo` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_termos_arquivos_quantidade_por_cnpj_ano_sequencial_sequencialtermo`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos/quantidade`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar quantidade documentos termo contrato no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialTermo` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_contratos_termos_arquivos_por_cnpj_ano_sequencial_sequencialtermo_sequencialdocumento`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos/{sequencialDocumento}`
- Description: Consulta dados públicos de contratos públicos, empenhos, termos e arquivos; ação consultar arquivo no caminho /v1/orgaos/{cnpj}/contratos/{ano}/{sequencial}/termos/{sequencialTermo}/arquivos/{sequencialDocumento}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialTermo` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `sequencialDocumento` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_irp_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}`
- Description: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_irp_arquivos_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/arquivos`
- Description: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar informacoes documentos irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/arquivos.

### Parameters
- `cnpj` (`path`, required): schema: {"maxLength":14,"minLength":14,"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_irp_arquivos_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/arquivos/quantidade`
- Description: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar irp documento quantidade no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/arquivos/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_irp_historico_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/historico`
- Description: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/historico.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_irp_historico_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/historico/quantidade`
- Description: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar quantidade no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/historico/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_irp_itens_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens`
- Description: Consulta dados públicos de intenções de registro de preços e seus itens; ação listar itens irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","maximum":50,"minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_irp_itens_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens/quantidade`
- Description: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar quantidade itens irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_irp_itens_por_cnpj_ano_sequencial_numeroitem`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens/{numeroItem}`
- Description: Consulta dados públicos de intenções de registro de preços e seus itens; ação consultar item irp no caminho /v1/orgaos/{cnpj}/irp/{ano}/{sequencial}/itens/{numeroItem}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `numeroItem` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_pca_consolidado_por_cnpj_ano`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/consolidado`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar dados orgao pca no caminho /v1/orgaos/{cnpj}/pca/{ano}/consolidado.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_pca_consolidado_unidades_por_cnpj_ano`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/consolidado/unidades`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar dados orgao pca unidades no caminho /v1/orgaos/{cnpj}/pca/{ano}/consolidado/unidades.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_pca_csv_por_cnpj_ano`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/csv`
- Description: Consulta dados públicos de planos de contratações anuais; ação listar planos todas unidades do orgao csv no caminho /v1/orgaos/{cnpj}/pca/{ano}/csv.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_pca_quantidade_por_cnpj_ano`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/quantidade`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar dados orgao pca quantidade no caminho /v1/orgaos/{cnpj}/pca/{ano}/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_pca_valorescategoriaitem_por_cnpj_ano`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/valorescategoriaitem`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar valores categoria item no caminho /v1/orgaos/{cnpj}/pca/{ano}/valorescategoriaitem.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `categoriaItem` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_obter_orgaos_pca_consolidado_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/consolidado`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar plano consolidado no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/consolidado.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_pca_itens_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar dados pca itens categoria no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `categoria` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 
- `pagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_pca_itens_contratacao_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/contratacao`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar itens plano por contratacao no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/contratacao.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `numeroContratacao` (`query`, required): schema: {"maxLength":100,"minLength":0,"type":"string"}; description: 
- `pagina` (`query`, optional): schema: {"default":1,"format":"int32","minimum":1,"type":"integer"}; description: 
- `tamanhoPagina` (`query`, optional): schema: {"default":10,"format":"int32","minimum":10,"type":"integer"}; description: 

## `pncp_obter_orgaos_pca_itens_plano_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/plano`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar plano com itens no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/plano.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 

## `pncp_obter_orgaos_pca_itens_quantidade_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/quantidade`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar dados pca itens quantidade itens no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/itens/quantidade.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `categoria` (`query`, optional): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_pca_valorescategoriaitem_por_cnpj_ano_sequencial`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/valorescategoriaitem`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar valores categoria item no caminho /v1/orgaos/{cnpj}/pca/{ano}/{sequencial}/valorescategoriaitem.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 
- `sequencial` (`path`, required): schema: {"format":"int32","minimum":1,"type":"integer"}; description: 
- `categoriaItem` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_obter_orgaos_pca_sequenciaisplano_por_cnpj_uasg_ano`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/pca/{uasg}/{ano}/sequenciaisplano`
- Description: Consulta dados públicos de planos de contratações anuais; ação consultar sequenciais do plano no caminho /v1/orgaos/{cnpj}/pca/{uasg}/{ano}/sequenciaisplano.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `uasg` (`path`, required): schema: {"type":"string"}; description: 
- `ano` (`path`, required): schema: {"format":"int32","type":"integer"}; description: 

## `pncp_obter_orgaos_unidades_por_cnpj`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/unidades`
- Description: Consulta dados públicos de órgãos e unidades públicas; ação consultar unidades orgao no caminho /v1/orgaos/{cnpj}/unidades.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 

## `pncp_obter_orgaos_unidades_por_cnpj_codigounidade`

- Provider: `pncp`
- Endpoint: `GET /v1/orgaos/{cnpj}/unidades/{codigoUnidade}`
- Description: Consulta dados públicos de órgãos e unidades públicas; ação consultar unidade orgao no caminho /v1/orgaos/{cnpj}/unidades/{codigoUnidade}.

### Parameters
- `cnpj` (`path`, required): schema: {"type":"string"}; description: 
- `codigoUnidade` (`path`, required): schema: {"type":"string"}; description: 

## `pncp_listar_portes_empresa`

- Provider: `pncp`
- Endpoint: `GET /v1/portes-empresa`
- Description: Consulta dados públicos de portes de empresa; ação listar registros no caminho /v1/portes-empresa.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_portes_empresa_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/portes-empresa/{id}`
- Description: Consulta dados públicos de portes de empresa; ação obter registro no caminho /v1/portes-empresa/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_tipo_instrumento_convocatorio_modo_disputa`

- Provider: `pncp`
- Endpoint: `GET /v1/tipo-instrumento-convocatorio-modo-disputa`
- Description: Consulta dados públicos de instrumentos convocatórios e modos de disputa; ação listar registros no caminho /v1/tipo-instrumento-convocatorio-modo-disputa.

### Parameters
- `tipoInstrumentoConvocatorioId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 
- `modoDisputaId` (`query`, optional): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_obter_tipo_instrumento_convocatorio_modo_disputa_por_tipoinstrumentoconvocatorioid_mododisputaid`

- Provider: `pncp`
- Endpoint: `GET /v1/tipo-instrumento-convocatorio-modo-disputa/{tipoInstrumentoConvocatorioId}/{modoDisputaId}`
- Description: Consulta dados públicos de instrumentos convocatórios e modos de disputa; ação obter registro no caminho /v1/tipo-instrumento-convocatorio-modo-disputa/{tipoInstrumentoConvocatorioId}/{modoDisputaId}.

### Parameters
- `tipoInstrumentoConvocatorioId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 
- `modoDisputaId` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_tipos_contratos`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-contratos`
- Description: Consulta dados públicos de tipos de contratos; ação listar registros no caminho /v1/tipos-contratos.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_tipos_contratos_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-contratos/{id}`
- Description: Consulta dados públicos de tipos de contratos; ação obter registro no caminho /v1/tipos-contratos/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_tipos_documentos`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-documentos`
- Description: Consulta dados públicos de tipos de documentos; ação listar registros no caminho /v1/tipos-documentos.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: Indicador de Status Ativo (True - Ativo/False - Inativo)

## `pncp_obter_tipos_documentos_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-documentos/{id}`
- Description: Consulta dados públicos de tipos de documentos; ação obter registro no caminho /v1/tipos-documentos/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_tipos_instrumentos_cobranca`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-instrumentos-cobranca`
- Description: Consulta dados públicos de tipos de instrumentos de cobrança; ação listar registros no caminho /v1/tipos-instrumentos-cobranca.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_tipos_instrumentos_cobranca_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-instrumentos-cobranca/{id}`
- Description: Consulta dados públicos de tipos de instrumentos de cobrança; ação obter registro no caminho /v1/tipos-instrumentos-cobranca/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_tipos_instrumentos_convocatorios`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-instrumentos-convocatorios`
- Description: Consulta dados públicos de tipos de instrumentos convocatórios; ação listar registros no caminho /v1/tipos-instrumentos-convocatorios.

### Parameters
- `statusAtivo` (`query`, optional): schema: {"type":"boolean"}; description: 

## `pncp_obter_tipos_instrumentos_convocatorios_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-instrumentos-convocatorios/{id}`
- Description: Consulta dados públicos de tipos de instrumentos convocatórios; ação obter registro no caminho /v1/tipos-instrumentos-convocatorios/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## `pncp_listar_tipos_parte_envolvida`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-parte-envolvida`
- Description: Consulta dados públicos de tipos de parte envolvida; ação obter tipos parte envolvida no caminho /v1/tipos-parte-envolvida.

### Parameters

## `pncp_obter_tipos_parte_envolvida_por_id`

- Provider: `pncp`
- Endpoint: `GET /v1/tipos-parte-envolvida/{id}`
- Description: Consulta dados públicos de tipos de parte envolvida; ação consultar tipo parte envolvida no caminho /v1/tipos-parte-envolvida/{id}.

### Parameters
- `id` (`path`, required): schema: {"format":"int64","type":"integer"}; description: 

## Tools semânticas e diagnóstico

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
