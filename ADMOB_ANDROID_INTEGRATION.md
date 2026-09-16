# Guia de Integração do Google AdMob - Trilha do Saber

Este documento detalha a integração do **Google Mobile Ads SDK (AdMob)** no aplicativo Android "Trilha do Saber", com foco total na **Política para Famílias do Google Play**, proteção de crianças (COPPA), LGPD e boas práticas de experiência do usuário.

---

## 📍 Bloco de Anúncios Configurado: "Banner_principal"

O bloco de anúncios **Banner_principal** já está configurado no projeto:
- **Nome do Bloco:** `Banner_principal`
- **Ad Unit ID:** `ca-app-pub-8922902046490534/7288943940`
- **Tipo de Anúncio:** Banner (Adaptativo / 320x50)

---

## 📍 Onde Inserir seu AdMob App ID Real para Produção

Durante o desenvolvimento e testes, o aplicativo utiliza **exclusivamente os IDs oficiais de teste do Google**, garantindo conformidade com as regras do AdMob contra impressões ou cliques inválidos em contas reais.

Quando você criar o aplicativo no console do Google AdMob e receber o seu **AdMob App ID** (no formato `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`), siga estes 3 passos simples:

### 1. No Código TypeScript / React
Abra o arquivo: `src/config/adMobConfig.ts`

```typescript
// 1. Defina IS_TEST_MODE como false para entrar em produção:
export const IS_TEST_MODE: boolean = false;

// 2. Insira seu App ID do AdMob:
export const PRODUCTION_ADMOB_APP_ID: string = 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY';

// 3. O seu Banner_principal já está cadastrado:
export const PRODUCTION_BANNER_AD_UNIT_ID: string = 'ca-app-pub-8922902046490534/7288943940';
```

### 2. No Manifesto Android (APK / AAB Nativo)
Abra o arquivo: `android/app/src/main/AndroidManifest.xml`

Localize a tag `<meta-data>`:
```xml
<!-- Substitua o valor pelo seu AdMob App ID real: -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" />
```

### 3. No Gerenciador Nativo Android Kotlin
Abra o arquivo: `android/app/src/main/java/com/trilhadosaber/app/AdMobManager.kt`

```kotlin
// O seu Banner_principal já está configurado:
private const val PRODUCTION_BANNER_AD_UNIT_ID = "ca-app-pub-8922902046490534/7288943940"

// Mude para false para liberar anúncios reais no APK/AAB:
private const val IS_TEST_MODE = false
```

---

## 🛡️ Cumprimento da Política para Famílias do Google Play

O aplicativo atende a todas as exigências para aplicativos voltados ao público infantil e jovem:

1. **Tratamento Dirigido a Crianças (COPPA / TFCD):**
   - Para crianças e perfis sem idade informada, a flag `setTagForChildDirectedTreatment` é ativada (`TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE`).
2. **Consentimento de Menores de Idade (TFUA):**
   - A flag `setTagForUnderAgeOfConsent` é ativada (`TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE`) para menores de idade.
3. **Classificação Máxima de Anúncios (G):**
   - `setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)` garante que apenas anúncios livres para todos os públicos sejam entregues.
4. **Sem Publicidade Personalizada:**
   - O parâmetro `npa: "1"` (Non-Personalized Ads) é enviado no bundle para bloquear anúncios baseados em histórico de navegação.
5. **Sem Identificadores de Publicidade:**
   - Nenhuma permissão `AD_ID` é requisitada para menores, impedindo a transmissão do Google Advertising ID (GAID/AAID).
6. **Não Armazenamento de Idade Exata:**
   - O sistema classifica o usuário apenas nas categorias (`criança`, `adolescente`, `adulto`, `idade não informada`). Nunca armazena data de nascimento nem números de idade exatos.
7. **Proteção ao Foco Pedagógico:**
   - Anúncios são **terminantemente bloqueados** em qualquer tela de prova, simulado, teste de xadrez ou resolução de exercícios. O banner é discreto e visível apenas nas telas principais de navegação, sem nunca sobrepor botões ou textos.
