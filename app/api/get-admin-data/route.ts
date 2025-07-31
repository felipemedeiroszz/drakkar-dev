import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all data in parallel
    const [
      enginePackagesResult,
      hullColorsResult,
      upholsteryPackagesResult,
      additionalOptionsResult,
      boatModelsResult,
      dealersResult,
      ordersResult,
      serviceRequestsResult,
      marketingContentResult,
      marketingManualsResult,
      marketingWarrantiesResult,
      factoryProductionResult,
    ] = await Promise.all([
      supabase.from("engine_packages").select("*").order("display_order", { ascending: true }),
      supabase.from("hull_colors").select("*").order("display_order", { ascending: true }),
      supabase.from("upholstery_packages").select("*").order("display_order", { ascending: true }),
      supabase.from("additional_options").select("*").order("display_order", { ascending: true }),
      supabase.from("boat_models").select("*").order("display_order", { ascending: true }),
      supabase.from("dealers").select("*").order("display_order", { ascending: true }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("service_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("marketing_content").select("*").order("created_at", { ascending: false }),
      supabase.from("marketing_manuals").select("*").order("display_order", { ascending: true }),
      supabase.from("marketing_warranties").select("*").order("display_order", { ascending: true }),
      supabase.from("factory_production").select("*").order("display_order", { ascending: true }),
    ])

    // Check for errors
    const errors = [
      enginePackagesResult.error,
      hullColorsResult.error,
      upholsteryPackagesResult.error,
      additionalOptionsResult.error,
      boatModelsResult.error,
      dealersResult.error,
      ordersResult.error,
      serviceRequestsResult.error,
      marketingContentResult.error,
      marketingManualsResult.error,
      marketingWarrantiesResult.error,
      factoryProductionResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error("Database errors:", errors)
      return NextResponse.json({ success: false, error: "Failed to fetch some data from database" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        enginePackages: enginePackagesResult.data || [],
        hullColors: hullColorsResult.data || [],
        upholsteryPackages: upholsteryPackagesResult.data || [],
        additionalOptions: additionalOptionsResult.data || [],
        boatModels: boatModelsResult.data || [],
        dealers: dealersResult.data || [],
        orders: ordersResult.data || [],
        serviceRequests: serviceRequestsResult.data || [],
        marketingContent: marketingContentResult.data || [],
        marketingManuals: marketingManualsResult.data || [],
        marketingWarranties: marketingWarrantiesResult.data || [],
        factoryProduction: factoryProductionResult.data || [],
      },
    })
  } catch (error) {
    console.error("Error in get-admin-data:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
