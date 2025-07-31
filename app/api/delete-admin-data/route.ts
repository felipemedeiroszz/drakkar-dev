import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function POST(request: Request) {
  try {
    const { type, id } = await request.json()

    let result
    switch (type) {
      case "engine_packages":
        result = await DatabaseService.deleteEnginePackage(id)
        break
      case "hull_colors":
        result = await DatabaseService.deleteHullColor(id)
        break
      case "upholstery_packages":
        result = await DatabaseService.deleteUpholsteryPackage(id)
        break
      case "additional_options":
        result = await DatabaseService.deleteAdditionalOption(id)
        break
      case "boat_models":
        result = await DatabaseService.deleteBoatModel(id)
        break
      case "dealers":
        result = await DatabaseService.deleteDealer(id)
        break
      case "orders": // New case for orders
        result = await DatabaseService.deleteOrder(id)
        break
      case "service_requests": // New case for service requests
        result = await DatabaseService.deleteServiceRequest(id)
        break
      default:
        throw new Error("Tipo de dados inválido")
    }

    return NextResponse.json({
      success: true,
      message: "Item deletado com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao deletar item:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
