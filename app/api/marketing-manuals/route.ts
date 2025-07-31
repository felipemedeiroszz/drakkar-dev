import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

const db = new DatabaseService()

export async function GET() {
  try {
    const manuals = await db.getMarketingManuals()
    return NextResponse.json({ success: true, data: manuals })
  } catch (error) {
    console.error("Error fetching marketing manuals:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch marketing manuals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const manual = await request.json()

    // Validate required fields
    if (!manual.name_en || !manual.name_pt || !manual.url) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await db.saveMarketingManual(manual)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error saving marketing manual:", error)
    return NextResponse.json({ success: false, error: "Failed to save marketing manual" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Manual ID is required" }, { status: 400 })
    }

    await db.deleteMarketingManual(Number.parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting marketing manual:", error)
    return NextResponse.json({ success: false, error: "Failed to delete marketing manual" }, { status: 500 })
  }
}
