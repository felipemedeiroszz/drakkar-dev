import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Verificando se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: SUPABASE_URL ou SUPABASE_ANON_KEY estão ausentes");
  throw new Error("SUPABASE_URL ou SUPABASE_ANON_KEY não estão definidos nas variáveis de ambiente");
}

// Inicializando o cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dealerName = searchParams.get("dealer")

    if (!dealerName) {
      return NextResponse.json({ success: false, error: "Dealer name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("boat_sales")
      .select("*")
      .eq("dealer_name", dealerName)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar as vendas de barcos:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("Erro na rota GET de boat-sales:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      dealerName,
      boatModel,
      salePriceUsd,
      salePriceEur,
      salePriceBrl,
      salePriceGbp,
      currency,
      marginPercentage,
      notes,
    } = body

    if (!dealerName || !boatModel) {
      return NextResponse.json({ success: false, error: "Dealer name and boat model are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("boat_sales")
      .upsert({
        dealer_name: dealerName,
        boat_model: boatModel,
        sale_price_usd: salePriceUsd || 0,
        sale_price_eur: salePriceEur || 0,
        sale_price_brl: salePriceBrl || 0,
        sale_price_gbp: salePriceGbp || 0,
        currency: currency || "USD",
        margin_percentage: marginPercentage || 0,
        notes: notes || "",
      })
      .select()

    if (error) {
      console.error("Erro ao salvar a venda do barco:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Erro na rota POST de boat-sales:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const dealerName = searchParams.get("dealer")

    if (!id || !dealerName) {
      return NextResponse.json({ success: false, error: "ID and dealer name are required" }, { status: 400 })
    }

    const { error } = await supabase.from("boat_sales").delete().eq("id", id).eq("dealer_name", dealerName)

    if (error) {
      console.error("Erro ao deletar a venda do barco:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro na rota DELETE de boat-sales:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
