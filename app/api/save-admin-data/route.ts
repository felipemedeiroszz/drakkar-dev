import { DatabaseService } from "@/lib/database-service"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { enginePackages, hullColors, upholsteryPackages, additionalOptions, boatModels, dealers, orders, mode } =
      await req.json()

    if (mode === "upsert") {
      const promises = []
      if (enginePackages) promises.push(DatabaseService.saveEnginePackages(enginePackages))
      if (hullColors) promises.push(DatabaseService.saveHullColors(hullColors))
      if (upholsteryPackages) promises.push(DatabaseService.saveUpholsteryPackages(upholsteryPackages))
      if (additionalOptions) promises.push(DatabaseService.saveAdditionalOptions(additionalOptions))
      if (boatModels) promises.push(DatabaseService.saveBoatModels(boatModels))
      if (dealers) promises.push(DatabaseService.saveDealers(dealers))
      if (orders) promises.push(DatabaseService.saveOrders(orders))

      await Promise.all(promises)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Save admin data error:", errorMessage)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
