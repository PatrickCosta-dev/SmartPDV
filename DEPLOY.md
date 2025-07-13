# 🚀 Guia de Deploy - SmartPDV

## 📋 Pré-requisitos

### **Desenvolvimento Local**
- Node.js 18+ 
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- Git

### **Para Android**
- Android Studio
- Android SDK
- Emulador Android ou dispositivo físico

### **Para iOS (macOS apenas)**
- Xcode 15+
- iOS Simulator ou dispositivo físico
- Apple Developer Account (para App Store)

### **Para Web**
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🛠️ Configuração Inicial

### **1. Clone e Instalação**
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/SmartPDV.git
cd SmartPDV

# Instale as dependências
npm install

# Verifique se tudo está funcionando
npm start
```

### **2. Configuração do Ambiente**
```bash
# Configure variáveis de ambiente (se necessário)
cp .env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

## 📱 Deploy para Mobile

### **Android**

#### **Desenvolvimento**
```bash
# Inicie o servidor de desenvolvimento
npm start

# Execute no Android
npm run android
```

#### **Build de Produção**
```bash
# Configure o EAS Build
npx eas build:configure

# Build para Android
npx eas build --platform android

# Build para Android APK
npx eas build --platform android --profile preview
```

#### **Publicação na Google Play Store**
```bash
# Build para produção
npx eas build --platform android --profile production

# Submeta para a Play Store
npx eas submit --platform android
```

### **iOS**

#### **Desenvolvimento**
```bash
# Execute no iOS (apenas macOS)
npm run ios
```

#### **Build de Produção**
```bash
# Build para iOS
npx eas build --platform ios

# Build para iOS Simulator
npx eas build --platform ios --profile preview
```

#### **Publicação na App Store**
```bash
# Build para produção
npx eas build --platform ios --profile production

# Submeta para a App Store
npx eas submit --platform ios
```

## 🌐 Deploy para Web

### **Desenvolvimento Local**
```bash
# Execute no navegador
npm run web
```

### **Build de Produção**
```bash
# Build para produção
npx expo export --platform web

# Os arquivos estarão em dist/
```

### **Deploy em Servidores**

#### **Netlify**
```bash
# Configure o build no netlify.toml
[build]
  publish = "dist"
  command = "npm run build:web"

# Deploy automático via Git
git push origin main
```

#### **Vercel**
```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### **GitHub Pages**
```bash
# Configure o GitHub Actions
# .github/workflows/deploy.yml

# Deploy automático via push
git push origin main
```

## 🔧 Configurações Avançadas

### **EAS Build Configuration**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

### **app.json Configuration**
```json
{
  "expo": {
    "name": "SmartPDV",
    "slug": "smartpdv",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.smartpdv.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.smartpdv.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## 🔐 Configurações de Segurança

### **Variáveis de Ambiente**
```bash
# .env
EXPO_PUBLIC_API_URL=https://api.smartpdv.com
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production
```

### **Certificados e Chaves**
```bash
# Android Keystore
keytool -genkey -v -keystore smartpdv.keystore -alias smartpdv -keyalg RSA -keysize 2048 -validity 10000

# iOS Certificates (via Xcode)
# 1. Abra Xcode
# 2. Vá para Preferences > Accounts
# 3. Adicione sua Apple ID
# 4. Gere certificados de desenvolvimento e distribuição
```

## 📊 Monitoramento e Analytics

### **Expo Analytics**
```bash
# Configure analytics
npx expo install expo-analytics

# No código
import * as Analytics from 'expo-analytics';
Analytics.logEvent('app_opened');
```

### **Crashlytics**
```bash
# Configure crash reporting
npx expo install expo-crashlytics

# No código
import * as Crashlytics from 'expo-crashlytics';
Crashlytics.log('App started');
```

## 🔄 CI/CD Pipeline

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy SmartPDV

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: npm test
      
    - name: Build for production
      run: npx expo export --platform web
      
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v2.0
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **Erro de Build Android**
```bash
# Limpe o cache
cd android && ./gradlew clean
cd .. && npx expo start --clear

# Verifique o SDK
sdkmanager --list
```

#### **Erro de Build iOS**
```bash
# Limpe o cache
cd ios && xcodebuild clean
cd .. && npx expo start --clear

# Verifique os certificados
security find-identity -v -p codesigning
```

#### **Erro de Dependências**
```bash
# Limpe o cache do npm
npm cache clean --force

# Delete node_modules e reinstale
rm -rf node_modules package-lock.json
npm install
```

#### **Problemas de Performance**
```bash
# Otimize o bundle
npx expo export --platform web --minify

# Verifique o tamanho do bundle
npx expo export --platform web --dump-assetmap
```

## 📞 Suporte

### **Canais de Ajuda**
- 📧 Email: suporte@smartpdv.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Website: www.smartpdv.com
- 📖 Documentação: docs.smartpdv.com

### **Comunidade**
- 💬 Discord: discord.gg/smartpdv
- 🐦 Twitter: @SmartPDV
- 📘 Facebook: facebook.com/SmartPDV

---

**SmartPDV Team** - Sistema Inteligente de Ponto de Venda 

Você está tentando rodar o app no modo **development build** do Expo, mas ainda não instalou o app de desenvolvimento no seu celular. Por isso aparece o erro:

```
No development build (com.fireblue17.SmartPDV) for this project is installed. Install a development build on the target device and try again.
```

## Como testar no celular via USB (Expo Development Build)

### 1. Gere o APK de desenvolvimento

No terminal, rode:
```sh
npx eas build --platform android --profile development
```
Isso vai gerar um APK de desenvolvimento (com todos os módulos nativos).

### 2. Baixe o APK gerado

- Quando o build terminar, o terminal vai mostrar um link para baixar o APK.
- Baixe o APK no seu computador.

### 3. Instale o APK no seu celular

- Conecte o celular via USB (com depuração USB ativada).
- Rode:
  ```sh
  adb install caminho/para/o/apk-baixado.apk
  ```
  Ou transfira o APK para o celular e instale manualmente.

### 4. Abra o app "SmartPDV" no celular

- Agora, com o Metro Bundler rodando (`npm start`), o app vai se conectar ao seu servidor local.
- Você pode rodar normalmente, inclusive com recursos nativos.

---

## Alternativa: Expo Go (sem recursos nativos customizados)

Se você não precisa testar módulos nativos customizados, pode simplesmente:
- Instalar o app **Expo Go** no seu celular.
- Rodar `npm start` no PC.
- Escanear o QR code com o Expo Go.

---

Se quiser, posso te guiar passo a passo em qualquer um dos métodos! Qual você prefere seguir? 