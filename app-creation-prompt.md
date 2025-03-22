# Prompt para Criação de Aplicativo de Lista de Supermercado Inteligente

## Visão Geral do Projeto

Crie um aplicativo mobile completo para gerenciamento de listas de supermercado chamado "SmartList" com as seguintes características:

- Framework: React Native ou Flutter (cross-platform)
- Banco de dados: Firebase/Firestore para nuvem e SQLite para armazenamento local
- Backend: Node.js com Express para API personalizada
- Integração com IA: TensorFlow Lite para funcionalidades de IA on-device e OpenAI API para análises complexas
- Interface: Material Design ou fluent design system com animações sutis

## Funcionalidades Essenciais

### 1. Sistema de Gestão de Listas

Desenvolva um sistema completo de listas de compras com:
- Criação, edição e exclusão de múltiplas listas
- Categorização automática de produtos
- Compartilhamento de listas com outros usuários
- Sistema de marcação de itens comprados com animação suave
- Reordenação manual e automática (por categoria, preço ou localização no mercado)
- Histórico de listas anteriores com opção de duplicação

### 2. Cadastro e Identificação de Produtos

Implemente múltiplas formas de adicionar produtos:
- Entrada manual com autocompletar inteligente
- Scanner de código de barras com armazenamento local
- Reconhecimento de voz para adição rápida de itens
- Reconhecimento de imagem para identificar produtos
- Importação de lista via texto ou foto de lista escrita à mão (usando OCR)

### 3. Sistema de IA para Histórico e Previsão de Preços

Desenvolva um sistema que:
- Rastreie e armazene histórico de preços por produto e estabelecimento
- Utilize web scraping inteligente para coletar preços online (mercados, sites comparadores)
- Crie gráficos interativos de evolução de preços
- Ofereça previsões de tendências de preço usando séries temporais
- Alerte sobre melhores momentos para compra baseado em histórico
- Sugira alternativas mais econômicas para produtos similares

### 4. Planejamento Financeiro

Crie funcionalidades para:
- Definição de orçamento total ou por categoria
- Estimativa de custo total da lista em tempo real
- Tracking de gastos mensais com compras
- Relatórios visuais de economia e gastos
- Sugestões para otimização de custos
- Comparação inteligente entre estabelecimentos

### 5. Interface de Usuário

Desenvolva uma UI/UX excepcional com:
- Design minimalista com foco em usabilidade
- Modo claro/escuro automático
- Tema personalizável com paleta de cores
- Onboarding interativo para novos usuários
- Modo de compra otimizado para uso no supermercado
- Tela principal personalizável com widgets de informações mais relevantes
- Acessibilidade completa (suporte a leitores de tela, alto contraste, tamanhos ajustáveis)

## Aspectos Técnicos

### Armazenamento e Sincronização

- Sistema offline-first com sincronização quando conectado
- Backup automático na nuvem
- Recuperação inteligente em caso de perda de conexão durante uso
- Compressão eficiente de dados para minimizar uso de dados móveis

### Integração com APIs Externas

- Integração com APIs de preços (BuscaPé, Mercado Livre, etc.)
- API própria para normalização de dados de produtos
- Serviço de reconhecimento de código de barras (Open Food Facts, etc.)
- Serviços de IA para processamento de linguagem natural e visão computacional

### Segurança e Privacidade

- Autenticação segura (e-mail/senha, Google, Apple, biometria)
- Criptografia de dados sensíveis
- Controles de compartilhamento granulares
- Política de privacidade transparente
- Conformidade com LGPD

## Fluxos de Usuário

### Onboarding

1. Tela de boas-vindas com principais benefícios do app
2. Opções de login/cadastro
3. Tour guiado das principais funcionalidades
4. Configuração inicial de preferências (supermercados favoritos, categoria de produtos, etc.)
5. Tutorial interativo para adicionar primeira lista

### Criação de Lista

1. Botão de "+" evidente na tela inicial
2. Opções de criação rápida ou personalizada
3. Campo de busca inteligente com sugestões baseadas em histórico
4. Opções de adicionar via voz, código de barras ou texto
5. Agrupamento automático por categorias com visualização personalizável

### Modo Compra

1. Interface otimizada para uso com uma mão
2. Itens exibidos em ordem de layout do supermercado
3. Marcação rápida com gestos
4. Calculadora flutuante para acompanhar gastos
5. Comparador de preços em tempo real
6. Notas rápidas por item

### Análise de Preços

1. Dashboard com gráficos de evolução por produto
2. Filtros interativos por período, estabelecimento, categoria
3. Alertas inteligentes sobre preços anômalos
4. Previsões de tendências para próximas semanas
5. Sugestões personalizadas de quando comprar

## Requisitos Específicos de IA

### Modelo de Previsão de Preços

- Treinamento em dados históricos de preços
- Features incluindo sazonalidade, inflação, eventos especiais (Black Friday)
- Capacidade de análise de séries temporais
- Intervalos de confiança visíveis nas previsões
- Auto-aprendizado com feedback do usuário

### Reconhecimento de Produtos

- Classificação por imagem de produtos
- Normalização de descrições usando NLP
- Associação inteligente de produtos similares
- Identificação de marcas e variantes
- Extração automática de informações nutricionais

## Métricas de Desempenho

- Tempo de inicialização < 2 segundos
- Resposta de scanner de código de barras < 1 segundo
- Sincronização em background sem impacto na experiência
- Precisão de previsão de preços > 85%
- Uso de bateria otimizado (< 5% em uso típico diário)
- Armazenamento eficiente (< 100MB para app + dados locais típicos)

## Estrutura de Arquivos e Organização do Código

- Arquitetura limpa com separação de responsabilidades
- Componentes reutilizáveis para elementos de UI
- Documentação clara para todos os serviços e módulos
- Testes unitários e de integração
- CI/CD para deployment automático

Por favor, gere o código completo para este aplicativo, estruturado em pastas apropriadas, com todos os recursos mencionados acima implementados, comentados e funcionais. Inclua também wireframes ou mockups para as principais telas do aplicativo.