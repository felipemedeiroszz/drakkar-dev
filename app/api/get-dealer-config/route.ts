import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dealerId = searchParams.get("dealer_id")

    console.log("🔍 Buscando configurações para dealer:", dealerId)

    // Buscar informações do dealer
    let dealerCountry = "All"
    if (dealerId) {
      const { data: dealerData, error: dealerError } = await supabase
        .from("dealers")
        .select("country")
        .eq("id", dealerId)
        .single()

      if (dealerError) {
        console.warn("⚠️ Dealer não encontrado, usando configurações globais")
      } else {
        dealerCountry = dealerData?.country || "All"
        console.log("🌍 País do dealer:", dealerCountry)
      }
    }

    // Buscar preços específicos configurados pelo dealer (se dealerId fornecido)
    let dealerPricing: any[] = []
    if (dealerId) {
      const { data: pricingData, error: pricingError } = await supabase
        .from("dealer_pricing")
        .select("*")
        .eq("dealer_id", dealerId)

      if (!pricingError && pricingData) {
        dealerPricing = pricingData
        console.log("💰 Preços específicos do dealer encontrados:", dealerPricing.length)
      }
    }

    // Função para aplicar preços MSRP do dealer
    const applyDealerPricing = (items: any[], itemType: string) => {
      return items.map((item) => {
        // Buscar preço específico configurado pelo dealer
        const dealerPrice = dealerPricing.find((p) => p.item_type === itemType && String(p.item_id) === String(item.id))

        if (dealerPrice) {
          // Usar preços MSRP configurados pelo dealer
          return {
            ...item,
            usd: dealerPrice.sale_price_usd || item.usd,
            brl: dealerPrice.sale_price_brl || item.brl,
            price_usd: dealerPrice.sale_price_usd || item.usd,
            price_brl: dealerPrice.sale_price_brl || item.brl,
            dealer_configured: true,
            margin_percentage: dealerPrice.margin_percentage || 0,
            cost_usd: item.usd, // Manter preço de custo original
            cost_brl: item.brl, // Manter preço de custo original
          }
        }

        // Usar preços base se não houver configuração específica
        return {
          ...item,
          dealer_configured: false,
          cost_usd: item.usd,
          cost_brl: item.brl,
        }
      })
    }

    // Buscar modelos de barco
    const { data: boatModels, error: boatError } = await supabase.from("boat_models").select("*").order("name")

    if (boatError) {
      console.error("Erro ao buscar modelos de barco:", boatError)
      return NextResponse.json({ success: false, error: boatError.message }, { status: 500 })
    }

    // Buscar pacotes de motor (filtrados por país)
    const { data: enginePackages, error: engineError } = await supabase
      .from("engine_packages")
      .select("*")
      .order("name")

    if (engineError) {
      console.error("Erro ao buscar pacotes de motor:", engineError)
      return NextResponse.json({ success: false, error: engineError.message }, { status: 500 })
    }

    // Filtrar pacotes de motor por país
    console.log("🔍 Filtrando pacotes de motor:")
    console.log("- Total de pacotes antes do filtro:", enginePackages?.length || 0)
    console.log("- País do dealer:", dealerCountry)

    enginePackages?.forEach((pkg: any, index: number) => {
      const shouldShow =
        !pkg.countries ||
        pkg.countries.length === 0 ||
        pkg.countries.includes("All") ||
        pkg.countries.includes(dealerCountry)
      console.log(
        `- Pacote ${index + 1} "${pkg.name}": países=[${pkg.countries?.join(", ") || "nenhum"}], mostrar=${shouldShow}`,
      )
    })

    const filteredEnginePackages =
      enginePackages?.filter((pkg: any) => {
        // Se não há países configurados ou está vazio, mostrar para todos
        if (!pkg.countries || pkg.countries.length === 0) return true

        // Se contém "All", mostrar para todos os dealers
        if (pkg.countries.includes("All")) return true

        // Mostrar apenas se o país do dealer está na lista de países do pacote
        return pkg.countries.includes(dealerCountry)
      }) || []

    console.log("- Total de pacotes após filtro:", filteredEnginePackages.length)

    // Buscar cores de casco
    const { data: hullColors, error: hullError } = await supabase.from("hull_colors").select("*").order("name")

    if (hullError) {
      console.error("Erro ao buscar cores de casco:", hullError)
      return NextResponse.json({ success: false, error: hullError.message }, { status: 500 })
    }

    // Buscar pacotes de estofamento
    const { data: upholsteryPackages, error: upholsteryError } = await supabase
      .from("upholstery_packages")
      .select("*")
      .order("name")

    if (upholsteryError) {
      console.error("Erro ao buscar pacotes de estofamento:", upholsteryError)
      return NextResponse.json({ success: false, error: upholsteryError.message }, { status: 500 })
    }

    // Buscar opções adicionais (filtradas por país)
    const { data: additionalOptions, error: optionsError } = await supabase
      .from("additional_options")
      .select("*")
      .order("name")

    if (optionsError) {
      console.error("Erro ao buscar opções adicionais:", optionsError)
      return NextResponse.json({ success: false, error: optionsError.message }, { status: 500 })
    }

    // Filtrar opções adicionais por país
    const filteredAdditionalOptions =
      additionalOptions?.filter((option: any) => {
        if (!option.countries || option.countries.length === 0) return true
        return option.countries.includes("All") || option.countries.includes(dealerCountry)
      }) || []

    // Aplicar preços MSRP do dealer a todos os itens
    const processedBoatModels = applyDealerPricing(boatModels || [], "boat_model")
    const processedEnginePackages = applyDealerPricing(filteredEnginePackages, "engine_package")
    const processedHullColors = applyDealerPricing(hullColors || [], "hull_color")
    const processedUpholsteryPackages = applyDealerPricing(upholsteryPackages || [], "upholstery_package")
    const processedAdditionalOptions = applyDealerPricing(filteredAdditionalOptions, "additional_option")

    const result = {
      boatModels: processedBoatModels,
      enginePackages: processedEnginePackages,
      hullColors: processedHullColors,
      upholsteryPackages: processedUpholsteryPackages,
      additionalOptions: processedAdditionalOptions,
      dealerCountry,
      dealerPricingCount: dealerPricing.length,
    }

    console.log("✅ Configurações carregadas com sucesso:")
    console.log("- Modelos de barco:", result.boatModels.length)
    console.log("- Pacotes de motor:", result.enginePackages.length)
    console.log("- Cores de casco:", result.hullColors.length)
    console.log("- Pacotes de estofamento:", result.upholsteryPackages.length)
    console.log("- Opções adicionais:", result.additionalOptions.length)
    console.log("- Preços MSRP configurados:", result.dealerPricingCount)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
