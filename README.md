# 🛒 SmartPDV - Sistema de Ponto de Venda Inteligente

## 📱 Sobre o Projeto

O **SmartPDV** é um sistema completo de Ponto de Venda desenvolvido em React Native com Expo, projetado para pequenos e médios negócios. O sistema oferece uma solução completa para gestão de vendas, produtos, clientes e estoque.

## ✨ Funcionalidades Implementadas

### 🛍️ **PDV (Ponto de Venda)**
- ✅ Interface moderna e intuitiva
- ✅ Busca de produtos em tempo real
- ✅ Carrinho de compras com controles de quantidade
- ✅ Múltiplas formas de pagamento (Dinheiro, PIX, Cartão)
- ✅ Sistema de cupons e descontos
- ✅ Descontos por item e desconto total
- ✅ Observações por item e venda
- ✅ Seleção de clientes
- ✅ Cálculo automático de totais
- ✅ Persistência do carrinho

### 📦 **Gestão de Produtos**
- ✅ Cadastro completo de produtos
- ✅ Categorização e códigos de barras
- ✅ Controle de preços e custos
- ✅ Busca e filtros avançados
- ✅ Edição e exclusão de produtos
- ✅ Interface responsiva

### 👥 **Sistema de Clientes**
- ✅ Cadastro completo de clientes
- ✅ Sistema de fidelidade com pontos
- ✅ Histórico de compras
- ✅ Busca e filtros
- ✅ Gestão de dados pessoais
- ✅ Interface moderna

### 📊 **Relatórios e Dashboard**
- ✅ Estatísticas gerais de vendas
- ✅ Produtos mais vendidos
- ✅ Análise por forma de pagamento
- ✅ Histórico completo de vendas
- ✅ Detalhes de cada venda
- ✅ Filtros e busca avançada
- ✅ Gráficos e métricas

### 🏪 **Gestão de Estoque**
- ✅ Controle de estoque em tempo real
- ✅ Alertas de estoque baixo
- ✅ Movimentações de entrada/saída
- ✅ Ajustes de estoque
- ✅ Histórico de movimentações
- ✅ Limites mínimo e máximo
- ✅ Status visual do estoque

### ⚙️ **Configurações do Sistema**
- ✅ Backup e restauração
- ✅ Exportação de dados
- ✅ Configurações gerais
- ✅ Gerenciamento de dados
- ✅ Informações do sistema
- ✅ Interface de administração

### 💾 **Banco de Dados**
- ✅ AsyncStorage para mobile (Android/iOS)
- ✅ localStorage para web
- ✅ Persistência automática
- ✅ Backup automático
- ✅ Sincronização de dados

## 🚀 Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **React Native Paper** - UI Components
- **Zustand** - Gerenciamento de estado
- **AsyncStorage** - Persistência local
- **AsyncStorage** - Persistência local
- **React Navigation** - Navegação
- **Expo Router** - Roteamento

## 📱 Plataformas Suportadas

- ✅ **Android** - Nativo com AsyncStorage
- ✅ **iOS** - Nativo com AsyncStorage  
- ✅ **Web** - Browser com localStorage
- ✅ **PWA** - Progressive Web App

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (para Android)
- Xcode (para iOS - macOS)

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/SmartPDV.git
cd SmartPDV
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicie o projeto**
```bash
npm start
```

4. **Execute no dispositivo**
- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

## 📋 Estrutura do Projeto

```
SmartPDV/
├── app/                    # Telas principais (Expo Router)
│   ├── pdv.tsx           # Ponto de Venda
│   ├── produtos.tsx      # Gestão de Produtos
│   ├── clientes.tsx      # Gestão de Clientes
│   ├── relatorios.tsx    # Relatórios e Dashboard
│   ├── estoque.tsx       # Gestão de Estoque
│   └── configuracoes.tsx # Configurações
├── src/
│   ├── database/         # Serviços de banco de dados
│   │   ├── productService.ts
│   │   ├── salesService.ts
│   │   ├── customerService.ts
│   │   ├── inventoryService.ts
│   │   └── backupService.ts
│   ├── store/           # Gerenciamento de estado
│   │   └── cartStore.ts
│   └── components/      # Componentes reutilizáveis
├── components/          # Componentes da UI
└── assets/             # Recursos estáticos
```

## 🎯 Funcionalidades Principais

### PDV (Ponto de Venda)
- Interface otimizada para vendas rápidas
- Busca instantânea de produtos
- Carrinho com controles intuitivos
- Múltiplas formas de pagamento
- Sistema de cupons e descontos
- Integração com clientes

### Gestão de Produtos
- Cadastro completo com categorias
- Controle de preços e custos
- Códigos de barras
- Busca avançada
- Interface responsiva

### Sistema de Clientes
- Cadastro completo
- Sistema de fidelidade
- Histórico de compras
- Pontos de fidelidade
- Gestão de dados

### Relatórios
- Dashboard com métricas
- Produtos mais vendidos
- Análise de vendas
- Histórico completo
- Exportação de dados

### Estoque
- Controle em tempo real
- Alertas automáticos
- Movimentações
- Ajustes de estoque
- Histórico completo

## 🔧 Configurações Avançadas

### Banco de Dados
O sistema utiliza:
- **AsyncStorage** para dispositivos móveis
- **localStorage** para web
- **Backup automático** a cada 24h
- **Sincronização** entre sessões

### Performance
- Carregamento lazy de componentes
- Cache de dados otimizado
- Compressão de imagens
- Otimização de listas

## 📊 Métricas do Projeto

- **Linhas de código**: ~15.000
- **Componentes**: 25+
- **Telas**: 6 principais
- **Serviços**: 6 de banco de dados
- **Funcionalidades**: 50+

## 🚀 Roadmap Futuro

### Funcionalidades Planejadas
- [ ] Impressão de comprovantes
- [ ] Integração com PIX
- [ ] Sincronização na nuvem
- [ ] Múltiplos usuários
- [ ] Relatórios avançados
- [ ] Integração com APIs externas

### Melhorias Técnicas
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Otimização de performance
- [ ] PWA completo
- [ ] Offline mode avançado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvido por

**SmartPDV Team**
- Desenvolvimento: React Native + Expo
- Design: Material Design
- Arquitetura: Clean Architecture

## 📞 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@smartpdv.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Website: www.smartpdv.com

---

**SmartPDV** - Transformando a gestão do seu negócio! 🚀
