import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET() {
  try {
    const dbService = new DatabaseService()
    const warranties = await dbService.getMarketingWarranties()

    return NextResponse.json({
      success: true,
      data: warranties,
    })
  } catch (error) {
    console.error("Error fetching marketing warranties:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch warranties" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const warranty = await request.json()
    const dbService = new DatabaseService()
    const savedWarranty = await dbService.saveMarketingWarranty(warranty)

    return NextResponse.json({
      success: true,
      data: savedWarranty,
    })
  } catch (error) {
    console.error("Error saving marketing warranty:", error)
    return NextResponse.json({ success: false, error: "Failed to save warranty" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const dbService = new DatabaseService()
    await dbService.deleteMarketingWarranty(Number.parseInt(id))

    return NextResponse.json({
      success: true,
      message: "Warranty deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting marketing warranty:", error)
    return NextResponse.json({ success: false, error: "Failed to delete warranty" }, { status: 500 })
  }
}
