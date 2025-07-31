import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("📦 Dados recebidos para criar pedido:", body)

    const {
      order_id,
      dealer_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_city,
      customer_state,
      customer_zip,
      customer_country,
      boat_model,
      engine_package,
      hull_color,
      upholstery_package,
      additional_options,
      payment_method,
      deposit_amount,
      additional_notes,
      total_usd,
      total_brl,
      status = "pending",
      factoryProductionId, // ID do item da factory production para remover
    } = body

    // Validação básica
    if (!order_id || !dealer_id || !customer_name || !customer_email) {
      return NextResponse.json({ success: false, error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    // Criar o pedido
    const orderData = {
      order_id,
      dealer_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_city,
      customer_state,
      customer_zip,
      customer_country,
      boat_model,
      engine_package,
      hull_color,
      upholstery_package,
      additional_options: Array.isArray(additional_options) ? additional_options : [],
      payment_method,
      deposit_amount: Number(deposit_amount) || 0,
      additional_notes,
      total_usd: Number(total_usd) || 0,
      total_brl: Number(total_brl) || 0,
      status,
    }

    console.log("💾 Salvando pedido:", orderData)

    const { data: orderResult, error: orderError } = await supabase.from("orders").insert([orderData]).select().single()

    if (orderError) {
      console.error("❌ Erro ao criar pedido:", orderError)
      return NextResponse.json({ success: false, error: orderError.message }, { status: 500 })
    }

    console.log("✅ Pedido criado com sucesso:", orderResult)

    // Se veio de factory production, remover o item da tabela
    if (factoryProductionId) {
      console.log("🏭 Removendo item da factory production, ID:", factoryProductionId)

      const { error: deleteError } = await supabase.from("factory_production").delete().eq("id", factoryProductionId)

      if (deleteError) {
        console.error("❌ Erro ao remover da factory production:", deleteError)
        // Não falha o pedido por causa disso, apenas loga o erro
      } else {
        console.log("✅ Item removido da factory production com sucesso")
      }
    }

    // Enviar notificação por email se configurado
    try {
      const notificationResponse = await fetch(`${request.url.split("/api")[0]}/api/send-email-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_order",
          data: orderResult,
        }),
      })

      if (!notificationResponse.ok) {
        console.warn("⚠️ Falha ao enviar notificação por email")
      }
    } catch (emailError) {
      console.warn("⚠️ Erro ao enviar notificação:", emailError)
    }

    return NextResponse.json({
      success: true,
      data: orderResult,
      message: "Pedido criado com sucesso!",
    })
  } catch (error) {
    console.error("❌ Erro interno:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
