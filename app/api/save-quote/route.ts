import { DatabaseService } from "@/lib/database-service"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log("Dados recebidos na API:", data)

    // Validar campos obrigatórios
    const requiredFields = [
      { field: data.customer?.name, name: "customerName" },
      { field: data.customer?.email, name: "customerEmail" },
      { field: data.customer?.phone, name: "customerPhone" },
      { field: data.model, name: "boatModel" }, // Changed from data.boatModel to data.model
      { field: data.engine, name: "enginePackage" }, // Changed from data.enginePackage to data.engine
      { field: data.hull_color, name: "hullColor" }, // Changed from data.hullColor to data.hull_color
      { field: data.dealerId, name: "dealerId" },
    ]

    for (const { field, name } of requiredFields) {
      if (!field) {
        console.error(`Campo obrigatório ausente: ${name}`)
        return NextResponse.json({ success: false, error: `Campo obrigatório ausente: ${name}` }, { status: 400 })
      }
    }

    // Gerar ID único para o orçamento
    const quoteId = DatabaseService.generateQuoteId()

    // Preparar dados para salvar no banco
    const quoteData = {
      quote_id: quoteId,
      dealer_id: data.dealerId,
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone,
      customer_address: data.customer.address || "",
      customer_city: data.customer.city || "",
      customer_state: data.customer.state || "",
      customer_zip: data.customer.zip || "",
      customer_country: data.customer.country || "",
      boat_model: data.model, // Changed from data.boatModel to data.model
      engine_package: data.engine, // Changed from data.enginePackage to data.engine
      hull_color: data.hull_color, // Changed from data.hullColor to data.hull_color
      upholstery_package: data.upholstery_package || "",
      additional_options: Array.isArray(data.options) ? data.options : [], // Changed from data.additionalOptions to data.options
      payment_method: data.payment_method || "",
      deposit_amount: Number.parseFloat(data.deposit_amount) || 0,
      additional_notes: data.additional_notes || "",
      total_usd: data.totalUsd, // Changed from Number.parseFloat(data.totalUSD) to data.totalUsd
      total_brl: data.totalBrl, // Changed from Number.parseFloat(data.totalBRL) to data.totalBrl
      status: "pending",
      valid_until: data.valid_until || null, // Changed from data.validUntil to data.valid_until
    }

    console.log("Dados preparados para o banco:", quoteData)

    // Salvar no banco de dados
    const savedQuote = await DatabaseService.createQuote(quoteData)

    console.log("✅ Orçamento salvo com sucesso:", savedQuote)

    return NextResponse.json({
      success: true,
      quoteId: quoteId,
      message: "Orçamento gerado com sucesso!",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("❌ Erro ao gerar orçamento:", errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: `Erro ao gerar orçamento: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
