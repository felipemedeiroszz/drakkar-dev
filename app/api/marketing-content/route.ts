import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("marketing_content")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching marketing content:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Ensure all fields have default values
    const processedData =
      data?.map((item) => ({
        ...item,
        title_en: item.title_en || "",
        title_pt: item.title_pt || "",
        subtitle_en: item.subtitle_en || "",
        subtitle_pt: item.subtitle_pt || "",
        image_url: item.image_url || "",
        boat_model: item.boat_model || "All Models",
      })) || []

    return NextResponse.json({ success: true, data: processedData })
  } catch (error) {
    console.error("Error in marketing content GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      title_en = "",
      title_pt = "",
      subtitle_en = "",
      subtitle_pt = "",
      image_url = "",
      boat_model = "All Models",
    } = body

    // Validate required fields
    if (!title_en.trim()) {
      return NextResponse.json({ success: false, error: "English title is required" }, { status: 400 })
    }

    if (!image_url.trim()) {
      return NextResponse.json({ success: false, error: "Image URL is required" }, { status: 400 })
    }

    let result
    if (id) {
      // Update existing content
      const { data, error } = await supabase
        .from("marketing_content")
        .update({
          title_en: title_en.trim(),
          title_pt: title_pt.trim(),
          subtitle_en: subtitle_en.trim(),
          subtitle_pt: subtitle_pt.trim(),
          image_url: image_url.trim(),
          boat_model: boat_model || "All Models",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()

      result = { data, error }
    } else {
      // Create new content
      const { data, error } = await supabase
        .from("marketing_content")
        .insert({
          title_en: title_en.trim(),
          title_pt: title_pt.trim(),
          subtitle_en: subtitle_en.trim(),
          subtitle_pt: subtitle_pt.trim(),
          image_url: image_url.trim(),
          boat_model: boat_model || "All Models",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      result = { data, error }
    }

    if (result.error) {
      console.error("Error saving marketing content:", result.error)
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data?.[0] })
  } catch (error) {
    console.error("Error in marketing content POST:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("marketing_content").delete().eq("id", id)

    if (error) {
      console.error("Error deleting marketing content:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in marketing content DELETE:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
