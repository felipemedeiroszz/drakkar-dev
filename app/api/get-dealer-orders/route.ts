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

    // Buscar pedidos do dealer
    const orders = await DatabaseService.getOrdersByDealer(dealer.id!)

    // Mapear os dados para o formato esperado pela interface
    const mappedOrders = orders.map((order) => ({
      orderId: order.order_id,
      dealer: dealerName,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
      },
      model: order.boat_model,
      engine: order.engine_package,
      hull_color: order.hull_color,
      upholstery_package: order.upholstery_package, // ADICIONAR ESTA LINHA
      options: order.additional_options || [],
      date: new Date(order.created_at || "").toLocaleDateString("pt-BR"),
      status: order.status,
      totalUsd: order.total_usd,
      totalBrl: order.total_brl,
      customerAddress: order.customer_address,
      customerCity: order.customer_city,
      customerState: order.customer_state,
      customerZip: order.customer_zip,
      customerCountry: order.customer_country,
      paymentMethod: order.payment_method,
      depositAmount: order.deposit_amount,
      additionalNotes: order.additional_notes,
    }))

    return NextResponse.json({
      success: true,
      data: mappedOrders,
    })
  } catch (error) {
    console.error("Erro ao buscar pedidos do dealer:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
