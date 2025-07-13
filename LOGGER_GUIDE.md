# Guia de Logging - SmartPDV

## 📋 Resumo

O projeto agora possui o `react-native-logs` instalado para um sistema de logging mais robusto e organizado.

## 🚀 Como Usar

### 1. Importar o Logger

```typescript
import log from './src/utils/logger';
```

### 2. Tipos de Log Disponíveis

```typescript
// Log de informação
log.info('Mensagem informativa');

// Log de debug (para desenvolvimento)
log.debug('Dados de debug:', { dados: 'exemplo' });

// Log de aviso
log.warn('Aviso importante');

// Log de erro
log.error('Erro crítico:', error);
```

### 3. Exemplos Práticos

#### Log de Inicialização
```typescript
useEffect(() => {
  async function initializeApp() {
    try {
      await initDatabase();
      log.info('Aplicação inicializada com sucesso');
    } catch (error) {
      log.error('Erro ao inicializar aplicação:', error);
    }
  }
  initializeApp();
}, []);
```

#### Log de Performance
```typescript
const startTime = Date.now();
// ... operação ...
const duration = Date.now() - startTime;
log.debug(`Operação completada em ${duration}ms`);
```

#### Log de API
```typescript
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    log.error(`API retornou status ${response.status}`);
  } else {
    log.info('Dados carregados com sucesso');
  }
} catch (error) {
  log.error('Erro na requisição API:', error);
}
```

## 🔧 Configuração

O logger está configurado em `src/utils/logger.ts` com:

- **Severity**: `debug` (mostra todos os níveis)
- **Transport**: `console.log` (aparece no terminal do Expo)
- **Cores**: Diferentes cores para cada tipo de log
- **Async**: `false` (logs síncronos para melhor debugging)

## 📱 Como Ver os Logs

### No Terminal (Desenvolvimento)
```bash
npx expo start
```
Os logs aparecem automaticamente no terminal.

### No Dispositivo
- Agite o dispositivo para abrir o menu de desenvolvedor
- Toque em "Show Logs"

### Filtros Úteis
```bash
# Ver apenas erros
npx expo logs | grep -i error

# Ver logs específicos
npx expo logs | grep -i "SmartPDV"
```

## 🎯 Boas Práticas

1. **Use níveis apropriados**:
   - `debug`: Para informações de desenvolvimento
   - `info`: Para eventos normais
   - `warn`: Para situações que merecem atenção
   - `error`: Para erros que precisam ser investigados

2. **Inclua contexto**:
   ```typescript
   // ❌ Ruim
   log.error('Erro');
   
   // ✅ Bom
   log.error('Erro ao salvar produto:', { productId, error });
   ```

3. **Não logue dados sensíveis**:
   ```typescript
   // ❌ Ruim
   log.debug('Senha do usuário:', password);
   
   // ✅ Bom
   log.debug('Usuário autenticado:', { userId: user.id });
   ```

## 📁 Arquivos Relacionados

- `src/utils/logger.ts` - Configuração do logger
- `src/utils/loggerExample.ts` - Exemplos de uso
- `App.tsx` - Exemplo de uso no componente principal 