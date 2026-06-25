# AI 협업 및 기술적 트러블슈팅 학습 노트 (Learning Notes)

본 문서는 지금까지 진행된 프로젝트 개발 과정에서 겪었던 **보안 및 아키텍처 한계 극복 사례, 기술적 트러블슈팅 노하우**와 더불어, 차후 AI 어시스턴트와 개발 협업을 할 때 적용하기 좋은 **프롬프트 템플릿**을 종합 정리한 학습 가이드입니다.

---

## 💡 핵심 기술적 트러블슈팅 및 학습 내용

### 1. Next.js 16 Proxy 미들웨어 호환성
* **문제 상황**: Vercel 배포 시 기존 `middleware.ts` 관례를 준수해 빌드를 시도하면 컴파일 에러(`Command "npm run build" exited with 1`)가 발생함.
* **학습 내용**: Next.js 16 버전의 breaking change로 인해 기존의 관습적인 미들웨어 구조가 더 이상 호환되지 않는 경우가 있습니다. 이 애플리케이션의 경우 **[src/proxy.ts](file:///c:/study/TODO/src/proxy.ts)** 파일을 생성하고 `export function proxy(request)` 형태로 명시적인 프록시 핸들러를 구성하여 Vercel 컴파일 빌드를 성공시켰습니다.
* **교훈**: Next.js 메이저 업데이트 시 프레임워크 제공 명세의 변화를 감지하고, `middleware` 관례 대신 전용 라우팅 파일 체계나 어댑터를 준수해야 빌드 안정성을 확보할 수 있습니다.

### 2. Turbopack 환경의 Prisma Node.js 점유 오류 (EPERM)
* **문제 상황**: 백그라운드에서 `next dev` Turbopack 개발 서버가 실행 중일 때 `npx prisma db push` 또는 `npx prisma generate`를 수행하면 `EPERM: operation not permitted` 에러와 함께 `*.dll.node` 파일 교체가 실패하는 현상.
* **학습 내용**: Next.js 개발 서버 프로세스가 내부적으로 Prisma 엔진 파일(`query_engine-windows.dll.node`)을 물리적으로 점유하기 때문입니다.
* **해결 명령어**: Prisma 관련 DB 마이그레이션 및 클라이언트 코드를 재생성할 때는 반드시 선제적으로 백그라운드 노드 프로세스를 죽이고 동기화를 진행한 뒤 다시 개발 서버를 올려야 합니다.
  ```bash
  cmd /c "taskkill /f /im node.exe & npx prisma generate"
  ```

### 3. Server Actions Form HTML5 타입 안전성 우회
* **문제 상황**: Next.js의 Server Action을 HTML `<form action={actionName}>`에 주입할 때, Action 리턴 타입과 HTML 폼의 암묵적 시그니처(`Promise<void>`) 불일치로 TypeScript 빌드 에러가 발생함.
* **학습 내용**: `actions.ts`가 API 응답 구조를 객체로 리턴하고 있는 상황에서 폼 액션과 직결하면 타입 에러가 생깁니다. 이를 방어하기 위해 다음과 같이 클라이언트 래퍼 또는 인라인 비동기 래퍼 함수를 선언하여 호출 흐름을 안전하게 중계할 수 있습니다.
  ```typescript
  // 클라이언트 측에서 래핑해 호출
  const handleAction = async () => {
    "use server";
    await targetAction();
  };
  ```

### 4. 일반 ID 회원가입 유효성 검사 우회
* **문제 상황**: 기존 구조에서는 회원가입 시 무조건 이메일 양식(`test@domain.com`)을 검사하도록 제약이 설정되어 단순 텍스트 아이디(예: `admin`) 가입 시 유효성 검사가 가로막힘.
* **학습 내용**: 프론트엔드 입력 타입을 `<input type="text">`로 가공하고, 백엔드의 이메일 정규식 포맷 강제를 해제하여 사용자 가입 편의성과 서비스 아이덴티티에 걸맞은 사용자 식별자를 제공하도록 조율했습니다.

---

## ✍️ AI 협업 향상을 위한 프롬프트 가이드

이후 유사한 프로젝트를 생성하거나, 다른 AI 어시스턴트에게 문맥(Context)을 주입할 때 사용하기 유용한 프롬프트 작성 템플릿입니다.

### 1. 신속한 기능 수정을 요청할 때 (Fast Workflow)
> **프롬프트 예시**:
> "다음 수정을 수행할 때 사전 기획 보고서 작성이나 변경 이유(What, Why)에 대한 서술은 생략하고, 즉시 변경할 파일의 핵심 수정본 코드와 CLI 명령어 위주로 바로 전개해 줘. 불필요한 서술은 생략하고 결론만 기술적으로 명확하게 대답해."

### 2. 기술 한계 및 breaking change 직면 시 학습 가이드
> **프롬프트 예시**:
> "사용하려는 Next.js 16 버전에서 기존 API 관례가 만료되었거나 breaking change에 따른 빌드 에러가 발생한 상황이야. `node_modules/next/dist/docs/` 명세나 공식 호환 가이드를 내부적으로 리서치하여 현재 규격에 맞춰 에러를 즉각 트러블슈팅할 수 있도록 리팩토링 코드를 작성해 줘."

### 3. Prisma 마이그레이션 에러 대비 가이드
> **프롬프트 예시**:
> "Prisma 스키마를 업데이트하고 마이그레이션할 때, 윈도우 환경 점유(EPERM) 오류가 발생하지 않도록 명령 프롬프트 상에서 node 프로세스를 강제 킬(`taskkill`)한 후 `prisma generate`를 연속 실행하는 단일 인라인 스크립트 형태로 명령어를 제공해 줘."

---

> [!TIP]
> **추가 권장 팁**
> 차후 새로운 프로젝트에서 이와 같은 AI 행동 지침 및 룰을 전역에 강제하고 싶다면, AI와의 채팅 창에 `/learn` 명령어를 입력해 보십시오. AI가 현재 축적한 트러블슈팅 지식과 지침을 학습 데이터로 기억하여 차후 작업 시 자동으로 적용하게 됩니다.
