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
          error: "Nome do dealer é obrigatório",
        },
        { status: 400 },
      )
    }

    // Buscar o dealer pelo nome
    const dealers = await DatabaseService.getDealers()
    const dealer = dealers.find((d) => d.name === dealerName)

    if (!dealer) {
      return NextResponse.json({
        success: true,
        data: [], // Retorna array vazio se dealer não encontrado
      })
    }

    // Buscar solicitações de serviço do dealer
    const serviceRequests = await DatabaseService.getServiceRequestsByDealer(dealer.id!)

    // Mapear os dados para o formato esperado pela interface
    const mappedRequests = serviceRequests.map((request) => ({
      id: request.request_id,
      customer: request.customer_name,
      model: request.boat_model,
      type: request.request_type,
      date: new Date(request.created_at || "").toLocaleDateString("pt-BR"),
      status: request.status,
      dealer: dealerName,
      issues: request.issues || [],
      // Dados adicionais para o modal
      customerEmail: request.customer_email,
      customerPhone: request.customer_phone,
      customerAddress: request.customer_address,
      hullId: request.hull_id,
      purchaseDate: request.purchase_date,
      engineHours: request.engine_hours,
    }))

    return NextResponse.json({
      success: true,
      data: mappedRequests,
    })
  } catch (error) {
    console.error("Erro ao buscar solicitações do dealer:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
