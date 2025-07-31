import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  // URL pública continua a mesma
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // No servidor podemos (e devemos) usar a service role
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET() {
  try {
    // Teste simples: selecionar 1 linha da tabela dealers
    const { error } = await supabase.from("dealers").select("id").limit(1)

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, message: String(err) }, { status: 500 })
  }
}
