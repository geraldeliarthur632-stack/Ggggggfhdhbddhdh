# Guia de Compilação do APK de Teste - Trilha do Saber (Android)

O projeto Android do **Trilha do Saber** está completamente configurado e preparado para gerar o **APK de teste (Debug APK)** para você instalar diretamente no seu celular Android.

---

## 📱 Dados de Configuração do Aplicativo Android

- **Nome do App:** Trilha do Saber
- **Application ID / Package:** `com.trilhadosaber.app`
- **Orientação:** Retrato (`portrait`)
- **Versão:** `1.0.0` (versionCode `1`)
- **SDK Mínimo (minSdk):** 23 (Android 6.0+)
- **SDK Alvo (targetSdk):** 34 (Android 14)
- **SDK de Anúncios:** Google Mobile Ads SDK (`play-services-ads:23.6.0`)
- **Bloco de Anúncios:** `Banner_principal` (`ca-app-pub-8922902046490534/7288943940`) em modo de teste ativo (`IS_TEST_MODE = true`)
- **Ícone do Aplicativo:** Gerado em todas as resoluções de densidade (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`)

---

## 🛠️ Como Gerar o APK de Teste (2 Opções Simples)

### Opção 1: Via Android Studio (Mais Recomendada)

1. Baixe os arquivos do projeto ou clone o repositório no seu computador.
2. Abra o **Android Studio**.
3. Clique em **Open** (Abrir) e selecione a pasta `android` do projeto.
4. Aguarde o Android Studio sincronizar o Gradle (ele fará o download das dependências automaticamente).
5. Para compilar o APK de teste:
   - No menu superior, clique em: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
6. Ao finalizar a compilação, aparecerá uma notificação no canto inferior direito:
   - Clique em **locate** para abrir a pasta com o arquivo `app-debug.apk`.
7. Conecte seu celular Android ao computador e transfira o arquivo `app-debug.apk` ou envie para o seu WhatsApp/Drive e instale no celular!

---

### Opção 2: Via Linha de Comando (Terminal / Prompt)

Se você já tem o Java (JDK 17) instalado no seu computador:

1. Abra o terminal e entre na pasta `android`:
   ```bash
   cd android
   ```
2. No Windows:
   ```cmd
   gradlew.bat assembleDebug
   ```
   No Linux ou macOS:
   ```bash
   chmod +x gradlew
   ./gradlew assembleDebug
   ```
3. O APK gerado estará disponível no caminho:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 🔄 Atualizando o conteúdo do Web App no Android

Sempre que você fizer alterações no código do Trilha do Saber e quiser atualizar os arquivos internos do Android:

Execute na raiz do projeto:
```bash
npm run build:android
```
Esse comando compila automaticamente a versão mais recente do aplicativo e coloca todos os arquivos diretamente dentro da pasta `android/app/src/main/assets/dist/` para a próxima compilação do APK.
