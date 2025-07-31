import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET() {
  try {
    const email = await DatabaseService.getNotificationEmail()
    return NextResponse.json({ success: true, email })
  } catch (error) {
    console.error("Erro ao buscar email de notificação:", error)
    return NextResponse.json({ success: false, error: "Erro ao buscar email de notificação" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email é obrigatório" }, { status: 400 })
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Email inválido" }, { status: 400 })
    }

    await DatabaseService.updateNotificationEmail(email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao salvar email de notificação:", error)
    return NextResponse.json({ success: false, error: "Erro ao salvar email de notificação" }, { status: 500 })
  }
}
