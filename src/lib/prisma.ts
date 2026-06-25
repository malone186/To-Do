import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Next.js 개발 모드(Development HMR)에서 중복 핫 리로딩으로 인해
// 데이터베이스 커넥션 인스턴스가 무한히 생성되는 현상을 차단하기 위해 싱글톤(Singleton) 패턴을 도입합니다.
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  // globalThis에 전역 prisma 인스턴스 참조 변수를 정의합니다.
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// 기존에 활성화된 전역 인스턴스가 존재하면 그것을 재사용하고, 없으면 새로 생성합니다.
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// 프로덕션(Production) 빌드가 아닐 때에만 globalThis에 인스턴스를 유지하도록 바인딩합니다.
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
