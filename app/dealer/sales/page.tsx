"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Notification, useNotification } from "@/components/notification"

interface CostItem {
  id: number
  name: string
  name_pt: string
  usd: number
  brl: number
  type: "boat_model" | "engine_package" | "hull_color" | "upholstery_package" | "additional_option"
}

interface PricingItem {
  id?: number
  dealer_id: string
  item_type: string
  item_id: string | number // Pode ser string ou number, mas será convertido para string para o DB
  item_name: string
  sale_price_usd: number
  sale_price_brl: number
  margin_percentage: number
}

export default function SalesPage() {
  const [lang, setLang] = useState("pt")
  const [loading, setLoading] = useState(true)
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([])
  const [dealerId, setDealerId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<
    "boat_model" | "engine_package" | "hull_color" | "upholstery_package" | "additional_option"
  >("boat_model")
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null)

  const { notification, showNotification, hideNotification } = useNotification()

  const translations = {
    pt: {
      "Back to Dashboard": "Voltar ao Painel",
      "Sales Configuration": "Configuração de Vendas",
      "Configure your sale prices and margins": "Configure seus preços de venda e margens",
      "Boat Models": "Modelos de Barco",
      "Engine Packages": "Pacotes de Motor",
      "Hull Colors": "Cores de Casco",
      "Upholstery Packages": "Pacotes de Estofamento",
      "Additional Options": "Opções Adicionais",
      Item: "Item",
      "Dealer Price": "Preço Dealer",
      "MSRP Price": "Preço MSRP",
      Margin: "Margem",
      Actions: "Ações",
      Edit: "Editar",
      Save: "Salvar",
      Cancel: "Cancelar",
      "Loading...": "Carregando...",
      "No items configured": "Nenhum item configurado",
      "Configure Sale Price": "Configurar Preço de Venda",
      "Sale Price (BRL)": "Preço de Venda (BRL)",
      "Margin (%)": "Margem (%)",
      "Price saved successfully!": "Preço salvo com sucesso!",
      "Error saving price": "Erro ao salvar preço",
      "Based on margin": "Baseado na margem",
      "Dealer specific pricing": "Preços específicos do dealer",
    },
    en: {
      "Back to Dashboard": "Back to Dashboard",
      "Sales Configuration": "Sales Configuration",
      "Configure your sale prices and margins": "Configure your sale prices and margins",
      "Boat Models": "Boat Models",
      "Engine Packages": "Engine Packages",
      "Hull Colors": "Hull Colors",
      "Upholstery Packages": "Upholstery Packages",
      "Additional Options": "Additional Options",
      Item: "Item",
      "Dealer Price": "Dealer Price",
      "MSRP Price": "MSRP Price",
      Margin: "Margin",
      Actions: "Actions",
      Edit: "Edit",
      Save: "Save",
      Cancel: "Cancel",
      "Loading...": "Loading...",
      "No items configured": "No items configured",
      "Configure Sale Price": "Configure Sale Price",
      "Sale Price (USD)": "Sale Price (USD)",
      "Margin (%)": "Margin (%)",
      "Price saved successfully!": "Price saved successfully!",
      "Error saving price": "Error saving price",
      "Based on margin": "Based on margin",
      "Dealer specific pricing": "Dealer specific pricing",
    },
    es: {
      "Back to Dashboard": "Volver al Panel",
      "Sales Configuration": "Configuración de Ventas",
      "Configure your sale prices and margins": "Configure sus precios de venta y márgenes",
      "Boat Models": "Modelos de Barco",
      "Engine Packages": "Paquetes de Motor",
      "Hull Colors": "Colores de Casco",
      "Upholstery Packages": "Paquetes de Tapicería",
      "Additional Options": "Opciones Adicionales",
      Item: "Artículo",
      "Dealer Price": "Precio Distribuidor",
      "MSRP Price": "Precio MSRP",
      Margin: "Margen",
      Actions: "Acciones",
      Edit: "Editar",
      Save: "Guardar",
      Cancel: "Cancelar",
      "Loading...": "Cargando...",
      "No items configured": "No hay artículos configurados",
      "Configure Sale Price": "Configurar Precio de Venta",
      "Sale Price (USD)": "Precio de Venta (USD)",
      "Margin (%)": "Margen (%)",
      "¡Precio guardado con éxito!": "¡Precio guardado con éxito!",
      "Error al guardar precio": "Error al guardar precio",
      "Basado en el margen": "Basado en el margen",
      "Precios específicos del distribuidor": "Precios específicos del distribuidor",
    },
  }

  // Função para obter moeda baseada no idioma
  const getCurrency = () => {
    return lang === "pt" ? "BRL" : "USD"
  }

  // Função para obter preço baseado no idioma
  const getPrice = (item: CostItem | PricingItem, type: "cost" | "sale") => {
    if (type === "cost") {
      const costItem = item as CostItem
      return lang === "pt" ? costItem.brl : costItem.usd
    } else {
      const pricingItem = item as PricingItem
      return lang === "pt" ? pricingItem.sale_price_brl : pricingItem.sale_price_usd
    }
  }

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)

    const currentDealerId = localStorage.getItem("currentDealerId")
    if (currentDealerId) {
      setDealerId(currentDealerId)
      loadData(currentDealerId)
    } else {
      showNotification("Dealer não identificado. Faça login novamente.", "error")
      setLoading(false)
    }
  }, [])

  const loadData = async (dealerId: string) => {
    try {
      setLoading(true)

      // Carregar itens de custo das tabelas principais (dados globais)
      const configResponse = await fetch("/api/get-dealer-config")
      const configResult = await configResponse.json()

      if (configResult.success) {
        const allItems: CostItem[] = [
          ...configResult.data.boatModels.map((item: any) => ({
            ...item,
            type: "boat_model" as const,
            usd: item.price_usd || item.usd || 0,
            brl: item.price_brl || item.brl || 0,
          })),
          ...configResult.data.enginePackages.map((item: any) => ({
            ...item,
            type: "engine_package" as const,
            usd: item.price_usd || item.usd || 0,
            brl: item.price_brl || item.brl || 0,
          })),
          ...configResult.data.hullColors.map((item: any) => ({
            ...item,
            type: "hull_color" as const,
            usd: item.price_usd || item.usd || 0,
            brl: item.price_brl || item.brl || 0,
          })),
          ...configResult.data.upholsteryPackages.map((item: any) => ({
            ...item,
            type: "upholstery_package" as const,
            usd: item.price_usd || item.usd || 0,
            brl: item.price_brl || item.brl || 0,
          })),
          ...configResult.data.additionalOptions.map((item: any) => ({
            ...item,
            type: "additional_option" as const,
            usd: item.price_usd || item.usd || 0,
            brl: item.price_brl || item.brl || 0,
          })),
        ]
        setCostItems(allItems)
      }

      // Carregar preços específicos configurados por ESTE dealer
      const pricingResponse = await fetch(`/api/dealer-pricing?dealer_id=${dealerId}`)
      const pricingResult = await pricingResponse.json()

      if (pricingResult.success) {
        setPricingItems(pricingResult.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      showNotification("Erro ao carregar dados", "error")
    } finally {
      setLoading(false)
    }
  }

  const getItemsForTab = () => {
    return costItems.filter((item) => item.type === activeTab)
  }

  const getPricingForItem = (itemId: number, itemType: string) => {
    // Busca preço específico DESTE dealer
    // CONVERSÃO PARA STRING: Garante que a comparação de item_id funcione corretamente
    // pois item_id na tabela dealer_pricing é TEXT (string) e itemId aqui é number.
    return pricingItems.find(
      (p) => String(p.item_id) === String(itemId) && p.item_type === itemType && p.dealer_id === dealerId,
    )
  }

  const handleEditItem = (costItem: CostItem) => {
    const existingPricing = getPricingForItem(costItem.id, costItem.type)

    if (existingPricing) {
      // Editar preço existente deste dealer
      setEditingItem({
        ...existingPricing,
        cost_price_usd: costItem.usd,
        cost_price_brl: costItem.brl,
      } as any)
    } else {
      // Criar novo preço específico para este dealer
      const newPricingItem: PricingItem = {
        dealer_id: dealerId, // Específico para este dealer
        item_type: costItem.type,
        item_id: costItem.id,
        item_name: lang === "pt" ? costItem.name_pt : costItem.name,
        sale_price_usd: costItem.usd,
        sale_price_brl: costItem.brl,
        margin_percentage: 0,
      }
      setEditingItem({
        ...newPricingItem,
        cost_price_usd: costItem.usd,
        cost_price_brl: costItem.brl,
      } as any)
    }
  }

  const calculateMargin = (costPrice: number, salePrice: number) => {
    if (costPrice === 0) return 0
    return ((salePrice - costPrice) / costPrice) * 100
  }

  const calculateSalePrice = (costPrice: number, margin: number) => {
    return costPrice * (1 + margin / 100)
  }

  const handleMarginChange = (margin: number) => {
    if (!editingItem) return

    const costPrice = lang === "pt" ? (editingItem as any).cost_price_brl : (editingItem as any).cost_price_usd
    const newSalePrice = calculateSalePrice(costPrice, margin)

    if (lang === "pt") {
      setEditingItem({
        ...editingItem,
        margin_percentage: margin,
        sale_price_brl: Number(newSalePrice.toFixed(2)),
      })
    } else {
      setEditingItem({
        ...editingItem,
        margin_percentage: margin,
        sale_price_usd: Number(newSalePrice.toFixed(2)),
      })
    }
  }

  const handleSalePriceChange = (value: number) => {
    if (!editingItem) return

    const costPrice = lang === "pt" ? (editingItem as any).cost_price_brl : (editingItem as any).cost_price_usd
    const margin = calculateMargin(costPrice, value)

    if (lang === "pt") {
      setEditingItem({
        ...editingItem,
        sale_price_brl: value,
        margin_percentage: Number(margin.toFixed(2)),
      })
    } else {
      setEditingItem({
        ...editingItem,
        sale_price_usd: value,
        margin_percentage: Number(margin.toFixed(2)),
      })
    }
  }

  const handleSaveItem = async () => {
    if (!editingItem) return

    // dealerId precisa existir
    if (!dealerId) {
      showNotification("Dealer não identificado – faça login novamente.", "error")
      return
    }

    // item_id deve ser string não vazia (pode ser UUID ou número)
    const itemId = String(editingItem.item_id).trim()
    if (!itemId) {
      showNotification("Erro interno: ID do item inválido", "error")
      return
    }

    // item_type e item_name obrigatórios
    if (!editingItem.item_type?.trim() || !editingItem.item_name?.trim()) {
      showNotification("Campos obrigatórios estão faltando", "error")
      return
    }

    try {
      const payload = {
        dealer_id: dealerId.trim(),
        item_type: editingItem.item_type.trim(),
        item_id: itemId, // ✅ string (uuid ou número)
        item_name: editingItem.item_name.trim(),
        sale_price_usd: Number(editingItem.sale_price_usd) || 0,
        sale_price_brl: Number(editingItem.sale_price_brl) || 0,
        margin_percentage: Number(editingItem.margin_percentage) || 0,
      }

      const response = await fetch("/api/dealer-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        showNotification(translations[lang as keyof typeof translations]["Price saved successfully!"], "success")
        setEditingItem(null)
        loadData(dealerId)
      } else {
        console.error("Erro da API:", result)
        showNotification(result.error || "Erro desconhecido", "error")
      }
    } catch (error) {
      console.error("Erro ao salvar preço:", error)
      showNotification(translations[lang as keyof typeof translations]["Error saving price"], "error")
    }
  }

  const formatCurrency = (value: number, currency: "BRL" | "USD") => {
    return new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: currency,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{translations[lang as keyof typeof translations]["Loading..."]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="max-w-7xl mx-auto">
        <Link
          href="/dealer/dashboard"
          className="inline-flex items-center text-blue-900 font-semibold mb-5 hover:underline"
        >
          ← {translations[lang as keyof typeof translations]["Back to Dashboard"]}
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            {translations[lang as keyof typeof translations]["Sales Configuration"]}
          </h1>
          <p className="text-lg text-gray-600">
            {translations[lang as keyof typeof translations]["Configure your sale prices and margins"]}
          </p>
          <p className="text-sm text-blue-600 mt-2">
            {translations[lang as keyof typeof translations]["Dealer specific pricing"]}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: "boat_model", label: translations[lang as keyof typeof translations]["Boat Models"] },
                { key: "engine_package", label: translations[lang as keyof typeof translations]["Engine Packages"] },
                { key: "hull_color", label: translations[lang as keyof typeof translations]["Hull Colors"] },
                {
                  key: "upholstery_package",
                  label: translations[lang as keyof typeof translations]["Upholstery Packages"],
                },
                {
                  key: "additional_option",
                  label: translations[lang as keyof typeof translations]["Additional Options"],
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Table */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["Item"]}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["Dealer Price"]} ({getCurrency()})
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["MSRP Price"]} ({getCurrency()})
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["Margin"]}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations[lang as keyof typeof translations]["Actions"]}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getItemsForTab().map((item) => {
                    const pricing = getPricingForItem(item.id, item.type)
                    const costPrice = getPrice(item, "cost")
                    const salePrice = pricing ? getPrice(pricing, "sale") : null

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lang === "pt" ? item.name_pt : item.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(costPrice, getCurrency() as "BRL" | "USD")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {salePrice !== null ? (
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(salePrice, getCurrency() as "BRL" | "USD")}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">
                              {translations[lang as keyof typeof translations]["No items configured"]}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pricing ? (
                            <div className="text-sm font-medium text-blue-600">
                              {pricing.margin_percentage.toFixed(1)}%
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditItem(item)} className="text-blue-600 hover:text-blue-900">
                            {translations[lang as keyof typeof translations]["Edit"]}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {translations[lang as keyof typeof translations]["Configure Sale Price"]}
                </h3>
                <div className="text-sm text-gray-600 mb-4">
                  <strong>{editingItem.item_name}</strong>
                  <br />
                  <span className="text-xs text-blue-600">
                    {translations[lang as keyof typeof translations]["Dealer specific pricing"]}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {translations[lang as keyof typeof translations]["Margin (%)"]}
                    </label>
                    <input
                      type="number"
                      value={editingItem.margin_percentage}
                      onChange={(e) => handleMarginChange(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      step="0.1"
                      min="0"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {translations[lang as keyof typeof translations]["Based on margin"]}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === "pt"
                        ? translations[lang as keyof typeof translations]["Sale Price (BRL)"]
                        : translations[lang as keyof typeof translations]["Sale Price (USD)"]}
                    </label>
                    <input
                      type="number"
                      value={lang === "pt" ? editingItem.sale_price_brl : editingItem.sale_price_usd}
                      onChange={(e) => handleSalePriceChange(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      step="0.01"
                      min="0"
                    />
                    <div className="text-xs text-gray-500">
                      {translations[lang as keyof typeof translations]["Dealer Price"]}:{" "}
                      {formatCurrency(
                        lang === "pt" ? (editingItem as any).cost_price_brl : (editingItem as any).cost_price_usd,
                        getCurrency() as "BRL" | "USD",
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    {translations[lang as keyof typeof translations]["Cancel"]}
                  </button>
                  <button
                    onClick={handleSaveItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {translations[lang as keyof typeof translations]["Save"]}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
