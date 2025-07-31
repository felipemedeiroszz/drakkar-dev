import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dealerName = searchParams.get("dealerName")

    if (!dealerName) {
      return NextResponse.json(
        {
          success: false,
          error: "Dealer name é obrigatório",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Buscando orçamentos para dealer:", dealerName)

    // Get dealer by name to get dealer_id
    const dealers = await DatabaseService.getDealers()
    const dealer = dealers.find((d) => d.name === dealerName)

    if (!dealer) {
      console.log("❌ Dealer não encontrado:", dealerName)
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    console.log("✅ Dealer encontrado:", dealer.id)

    // Get quotes for this dealer
    const quotes = await DatabaseService.getQuotesByDealer(dealer.id)

    console.log("📊 Orçamentos encontrados:", quotes.length)

    // Map database quotes to frontend format
    const mappedQuotes = quotes.map((quote) => ({
      quoteId: quote.quote_id,
      dealer: dealerName,
      customer: {
        name: quote.customer_name,
        email: quote.customer_email,
        phone: quote.customer_phone,
        address: quote.customer_address,
        city: quote.customer_city,
        state: quote.customer_state,
        zip: quote.customer_zip,
        country: quote.customer_country,
      },
      model: quote.boat_model,
      engine: quote.engine_package,
      hull_color: quote.hull_color,
      upholstery_package: quote.upholstery_package,
      options: Array.isArray(quote.additional_options) ? quote.additional_options : [],
      paymentMethod: quote.payment_method,
      depositAmount: quote.deposit_amount,
      additionalNotes: quote.additional_notes,
      date: quote.created_at ? new Date(quote.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      status: quote.status,
      totalUsd: quote.total_usd,
      totalBrl: quote.total_brl,
      validUntil: quote.valid_until,
    }))

    return NextResponse.json({
      success: true,
      data: mappedQuotes,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar orçamentos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
