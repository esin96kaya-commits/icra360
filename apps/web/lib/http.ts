import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@icra360/domain";

export function jsonError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "Gönderilen veriler geçersiz." },
      { status: 422 },
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
  }
  console.error("unhandled_error");
  return NextResponse.json({ code: "INTERNAL", message: "İşlem tamamlanamadı." }, { status: 500 });
}

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
