"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Notification, useNotification } from "@/components/notification"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface Issue {
  text: string
  imageUrl?: string
  isUploading?: boolean
}

interface ServiceRequest {
  id: string
  customer: string
  model: string
  type: string
  date: string
  status: string
  dealer: string
  issues: Issue[]
  // Novos campos do banco
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  hullId?: string
  purchaseDate?: string
  engineHours?: string
}

interface ServiceMessage {
  id: number
  service_request_id: string
  sender_type: "admin" | "dealer"
  sender_name: string
  message: string
  created_at: string
  read_at?: string
}

interface BoatModel {
  name: string
  name_pt: string
}

export default function AfterSalesPage() {
  const [lang, setLang] = useState("pt")
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [issues, setIssues] = useState<Issue[]>([{ text: "", imageUrl: undefined, isUploading: false }])
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputFileRefs = useRef<(HTMLInputElement | null)[]>([])
  const modalContentRef = useRef<HTMLDivElement>(null)
  const [boatModels, setBoatModels] = useState<BoatModel[]>([])

  // New state for messaging
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messages, setMessages] = useState<ServiceMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    boat_model: "",
    hull_id: "",
    purchase_date: "",
    engine_hours: "",
    request_type: "",
  })

  const translations = {
    pt: {
      "After-Sales Service": "Pós-venda",
      "Submit and track after-sales service requests and warranty claims.":
        "Envie e acompanhe solicitações de pós-venda e garantias.",
      "Back to Dashboard": "Voltar ao Painel",
      "Customer Information": "Informações do Cliente",
      "Customer Name": "Nome do Cliente",
      Email: "Email",
      Phone: "Telefone",
      Address: "Endereço",
      "Boat Information": "Informações do Barco",
      "Boat Model": "Modelo do Barco",
      "Hull Identification Number (HIN)": "Número de Identificação do Casco (HIN)",
      "Purchase Date": "Data da Compra",
      "Engine Hours": "Horas do Motor",
      "Service Request Details": "Detalhes da Solicitação de Serviço",
      "Request Type": "Tipo de Solicitação",
      "Issue Descriptions": "Descrições dos Problemas",
      "Add Issue": "Adicionar Problema",
      Remove: "Remover",
      "Submit Request": "Enviar Solicitação",
      Cancel: "Cancelar",
      "Service Request History": "Histórico de Solicitações de Serviço",
      "Request ID": "ID da Solicitação",
      Customer: "Cliente",
      "Date Submitted": "Data de Envio",
      Status: "Status",
      "No requests yet": "Nenhuma solicitação ainda",
      "View Details": "Ver Detalhes",
      "Service Request Details": "Detalhes da Solicitação de Serviço",
      Date: "Data",
      Type: "Tipo",
      Issues: "Problemas",
      Close: "Fechar",
      "Add Image": "Adicionar Imagem",
      Uploading: "Enviando...",
      Print: "Imprimir",
      "Generate PDF": "Gerar PDF",
      "Select Model": "Selecione o Modelo",
      Messages: "Mensagens",
      "View Messages": "Ver Mensagens",
      "Send Message": "Enviar Mensagem",
      "Type your message...": "Digite sua mensagem...",
      Send: "Enviar",
      "No messages yet": "Nenhuma mensagem ainda",
      Administrator: "Administrador",
      "New message from admin": "Nova mensagem do administrador",
    },
    en: {
      "After-Sales Service": "After-Sales Service",
      "Submit and track after-sales service requests and warranty claims.":
        "Submit and track after-sales service requests and warranty claims.",
      "Back to Dashboard": "Back to Dashboard",
      "Customer Information": "Customer Information",
      "Customer Name": "Customer Name",
      Email: "Email",
      Phone: "Phone",
      Address: "Address",
      "Boat Information": "Boat Information",
      "Boat Model": "Boat Model",
      "Hull Identification Number (HIN)": "Hull Identification Number (HIN)",
      "Purchase Date": "Purchase Date",
      "Engine Hours": "Engine Hours",
      "Service Request Details": "Service Request Details",
      "Request Type": "Request Type",
      "Issue Descriptions": "Issue Descriptions",
      "Add Issue": "Add Issue",
      Remove: "Remove",
      "Submit Request": "Submit Request",
      Cancel: "Cancel",
      "Service Request History": "Service Request History",
      "Request ID": "Request ID",
      Customer: "Customer",
      "Date Submitted": "Date Submitted",
      Status: "Status",
      "No requests yet": "No requests yet",
      "View Details": "View Details",
      "Service Request Details": "Service Request Details",
      Date: "Date",
      Type: "Type",
      Issues: "Issues",
      Close: "Close",
      "Add Image": "Add Image",
      Uploading: "Uploading...",
      Print: "Print",
      "Generate PDF": "Generate PDF",
      "Select Model": "Select Model",
      Messages: "Messages",
      "View Messages": "View Messages",
      "Send Message": "Send Message",
      "Type your message...": "Type your message...",
      Send: "Send",
      "No messages yet": "No messages yet",
      Administrator: "Administrator",
      "New message from admin": "New message from admin",
    },
    es: {
      "After-Sales Service": "Servicio Postventa",
      "Submit and track after-sales service requests and warranty claims.":
        "Envíe y rastree solicitudes de servicio postventa y garantías.",
      "Back to Dashboard": "Volver al Panel",
      "Customer Information": "Información del Cliente",
      "Customer Name": "Nombre del Cliente",
      Email: "Correo Electrónico",
      Phone: "Teléfono",
      Address: "Dirección",
      "Boat Information": "Información del Barco",
      "Boat Model": "Modelo del Barco",
      "Hull Identification Number (HIN)": "Número de Identificación del Casco (HIN)",
      "Purchase Date": "Fecha de Compra",
      "Engine Hours": "Horas del Motor",
      "Service Request Details": "Detalles de la Solicitud de Servicio",
      "Request Type": "Tipo de Solicitud",
      "Issue Descriptions": "Descripciones de Problemas",
      "Add Issue": "Agregar Problema",
      Remove: "Eliminar",
      "Submit Request": "Enviar Solicitud",
      Cancel: "Cancelar",
      "Service Request History": "Historial de Solicitudes de Servicio",
      "Request ID": "ID de Solicitud",
      Customer: "Cliente",
      "Date Submitted": "Fecha de Envío",
      Status: "Estado",
      "No hay solicitudes aún": "No hay solicitudes aún",
      "View Details": "Ver Detalles",
      "Service Request Details": "Detalles de la Solicitud de Servicio",
      Date: "Fecha",
      Type: "Tipo",
      Issues: "Problemas",
      Close: "Cerrar",
      "Add Image": "Añadir Imagen",
      Uploading: "Subiendo...",
      Print: "Imprimir",
      "Generate PDF": "Generar PDF",
      "Select Model": "Seleccione el Modelo",
      Messages: "Mensajes",
      "View Messages": "Ver Mensajes",
      "Send Message": "Enviar Mensaje",
      "Type your message...": "Escriba su mensaje...",
      Send: "Enviar",
      "No messages yet": "No hay mensajes aún",
      Administrator: "Administrador",
      "New message from admin": "Nuevo mensaje del administrador",
    },
  }

  const { notification, showNotification, hideNotification } = useNotification()

  useEffect(() => {
    const savedLang = localStorage.getItem("selectedLang") || "pt"
    setLang(savedLang)
    loadServiceRequests()
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/get-admin-data")
      const data = await response.json()
      if (data.success) {
        setBoatModels(data.data.boatModels || [])
      } else {
        console.error("Erro ao carregar modelos de barcos:", data.error)
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
    }
  }

  const loadServiceRequests = async () => {
    try {
      setIsLoading(true)
      const dealerName = localStorage.getItem("currentDealerName") || ""

      if (!dealerName) {
        setServiceRequests([])
        return
      }

      const response = await fetch(`/api/get-dealer-service-requests?dealerName=${encodeURIComponent(dealerName)}`)
      const result = await response.json()

      if (result.success) {
        setServiceRequests(result.data)
      } else {
        console.error("Erro ao carregar solicitações:", result.error)
        setServiceRequests([])
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error)
      setServiceRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (serviceRequestId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/service-messages?serviceRequestId=${encodeURIComponent(serviceRequestId)}`)

      // Parse JSON regardless of status to inspect possible error details
      const result = await response.json()

      if (!response.ok) {
        console.error("Error loading messages:", result.error)
        setMessages([])
        return
      }

      // When successful the route returns `{ messages: [...] }`
      setMessages(result.messages || [])
    } catch (error) {
      console.error("Error loading messages:", error)
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest) return

    setIsSendingMessage(true)
    try {
      const dealerName = localStorage.getItem("currentDealerName") || "Dealer"

      const response = await fetch("/api/service-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceRequestId: selectedRequest.id,
          senderType: "dealer",
          senderName: dealerName,
          message: newMessage.trim(),
        }),
      })

      const result = await response.json()

      if (response.ok && result.data) {
        // Adiciona a nova mensagem à lista imediatamente
        setMessages((prev) => [...prev, result.data])
        setNewMessage("")
        showNotification("✅ Mensagem enviada com sucesso!", "success")
      } else {
        showNotification("❌ Erro ao enviar mensagem: " + (result.error || "Erro desconhecido"), "error")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      showNotification("❌ Erro ao enviar mensagem", "error")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleViewMessages = async (request: ServiceRequest) => {
    setSelectedRequest(request)
    setShowMessageModal(true)
    await loadMessages(request.id)
  }

  const generateRequestId = () => {
    const now = new Date()
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}`
    const randomPart = Math.floor(Math.random() * 9000 + 1000) // 4 dígitos
    return `SR-${datePart}-${randomPart}`
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addIssue = () => {
    setIssues([...issues, { text: "", imageUrl: undefined, isUploading: false }])
  }

  const removeIssue = (index: number) => {
    if (issues.length > 1) {
      setIssues(issues.filter((_, i) => i !== index))
    }
  }

  const updateIssueText = (index: number, value: string) => {
    const newIssues = [...issues]
    newIssues[index].text = value
    setIssues(newIssues)
  }

  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return

    const newIssues = [...issues]
    newIssues[index].isUploading = true
    setIssues(newIssues)

    try {
      const uniqueName = `service-request-${Date.now()}-${file.name}`

      // Create FormData to send the file properly
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData, // Send FormData, not the file directly
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha no upload da imagem.")
      }

      const result = await response.json()
      const updatedIssues = [...issues]
      updatedIssues[index].imageUrl = result.url
      updatedIssues[index].isUploading = false
      setIssues(updatedIssues)

      showNotification("✅ Imagem enviada com sucesso!", "success")
    } catch (error) {
      console.error("Error uploading image:", error)
      showNotification(
        `❌ Erro ao enviar imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        "error",
      )

      const finalIssues = [...issues]
      finalIssues[index].isUploading = false
      setIssues(finalIssues)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validIssues = issues
      .filter((issue) => issue.text.trim() !== "")
      .map((issue) => ({ text: issue.text, imageUrl: issue.imageUrl })) // Limpar campos de UI

    if (validIssues.length === 0) {
      showNotification("Por favor, descreva pelo menos um problema", "error")
      return
    }

    try {
      const requestId = generateRequestId()
      const dealerName = localStorage.getItem("currentDealerName") || "Dealer"

      const requestData = {
        requestId,
        dealerName,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        boat_model: formData.boat_model,
        hull_id: formData.hull_id,
        purchase_date: formData.purchase_date,
        engine_hours: formData.engine_hours,
        request_type: formData.request_type,
        issues: validIssues,
        status: "Open",
      }

      const response = await fetch("/api/save-service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (result.success) {
        setFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          customer_address: "",
          boat_model: "",
          hull_id: "",
          purchase_date: "",
          engine_hours: "",
          request_type: "",
        })
        setIssues([{ text: "", imageUrl: undefined, isUploading: false }])

        loadServiceRequests()
        showNotification("Service request submitted successfully!", "success")
      } else {
        throw new Error(result.error || "Erro ao salvar solicitação")
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error)
      showNotification("Erro ao enviar solicitação: " + String(error), "error")
    }
  }

  const showRequestDetails = (request: ServiceRequest) => {
    setSelectedRequest(request)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedRequest(null)
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow && selectedRequest) {
      const printContent = generatePrintableContent()
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const generatePrintableContent = () => {
    if (!selectedRequest) return ""
    const isPt = lang === "pt"

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Solicitação ${selectedRequest.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .logo-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #1e40af;
          }
          .logo-header img {
            max-width: 300px;
            height: auto;
            margin-bottom: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            margin: 10px 0 0 0;
            font-size: 28px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-section h3 {
            color: #1e40af;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .info-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 10px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-item strong {
            color: #374151;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            background-color: #dbeafe;
            color: #1e40af;
          }
          .issues-list {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
          }
          .issue-item {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            background-color: white;
          }
          .full-width {
            grid-column: 1 / -1;
          }
        </style>
      </head>
      <body>
        <div class="logo-header">
          <img src="/images/logo_drakkar.png" alt="Drakkar Boats" />
        </div>
        
        <div class="header">
          <h1>${translations[lang as keyof typeof translations]["Service Request Details"]}</h1>
        </div>

        <div class="info-grid">
          <div>
            <strong>ID:</strong><br>
            <span style="font-family: monospace; font-size: 14px;">${selectedRequest.id}</span>
          </div>
          <div>
            <strong>${translations[lang as keyof typeof translations]["Date"]}:</strong><br>
            ${selectedRequest.date}
          </div>
          <div>
            <strong>${translations[lang as keyof typeof translations]["Status"]}:</strong><br>
            <span class="status-badge">${selectedRequest.status}</span>
          </div>
        </div>

        <div class="info-section">
          <h3>${translations[lang as keyof typeof translations]["Customer"]}</h3>
          <div class="info-row">
            <div class="info-item">
              <strong>Nome:</strong> ${selectedRequest.customer}
            </div>
            <div class="info-item">
              <strong>Email:</strong> ${selectedRequest.customerEmail || "N/A"}
            </div>
            <div class="info-item">
              <strong>Telefone:</strong> ${selectedRequest.customerPhone || "N/A"}
            </div>
            <div class="info-item">
              <strong>Endereço:</strong> ${selectedRequest.customerAddress || "N/A"}
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>${translations[lang as keyof typeof translations]["Boat Information"]}</h3>
          <div class="info-row">
            <div class="info-item">
              <strong>${translations[lang as keyof typeof translations]["Boat Model"]}:</strong> ${selectedRequest.model}
            </div>
            <div class="info-item">
              <strong>Hull ID:</strong> ${selectedRequest.hullId || "N/A"}
            </div>
            <div class="info-item">
              <strong>Data da Compra:</strong> ${selectedRequest.purchaseDate || "N/A"}
            </div>
            <div class="info-item">
              <strong>Horas do Motor:</strong> ${selectedRequest.engineHours || "N/A"}
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>${translations[lang as keyof typeof translations]["Service Request Details"]}</h3>
          <div class="info-item">
            <strong>${translations[lang as keyof typeof translations]["Request Type"]}:</strong> ${selectedRequest.type}
          </div>
        </div>

        <div class="info-section">
          <h3>${translations[lang as keyof typeof translations]["Issues"]}</h3>
          <div class="issues-list">
            ${selectedRequest.issues
              .map(
                (issue, index) => `
              <div class="issue-item">
                <p><strong>Problema ${index + 1}:</strong> ${issue.text}</p>
                ${issue.imageUrl ? "<p><em>Imagem anexada</em></p>" : ""}
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </body>
    </html>
  `
  }

  const handleGeneratePdf = () => {
    const input = modalContentRef.current
    if (input && selectedRequest) {
      const buttons = input.querySelectorAll(".action-buttons")
      buttons.forEach((btn) => ((btn as HTMLElement).style.display = "none"))

      html2canvas(input, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF("p", "mm", "a4")
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width

        if (pdfHeight > pdf.internal.pageSize.getHeight()) {
          const ratio = pdf.internal.pageSize.getHeight() / pdfHeight
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth * ratio, pdf.internal.pageSize.getHeight())
        } else {
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
        }

        pdf.save(`solicitacao-${selectedRequest.id}.pdf`)

        buttons.forEach((btn) => ((btn as HTMLElement).style.display = "block"))
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dealer/dashboard"
          className="inline-flex items-center text-blue-900 font-semibold mb-5 hover:underline"
        >
          ← {translations[lang as keyof typeof translations]["Back to Dashboard"]}
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            {translations[lang as keyof typeof translations]["After-Sales Service"]}
          </h1>
          <p className="text-lg text-gray-600">
            {
              translations[lang as keyof typeof translations][
                "Submit and track after-sales service requests and warranty claims."
              ]
            }
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <form onSubmit={handleSubmit}>
            {/* Customer Information */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-blue-900 mb-6">
                {translations[lang as keyof typeof translations]["Customer Information"]}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Customer Name"]}
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange("customer_name", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Email"]}
                  </label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange("customer_email", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Phone"]}
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange("customer_phone", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Address"]}
                  </label>
                  <input
                    type="text"
                    value={formData.customer_address}
                    onChange={(e) => handleInputChange("customer_address", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Boat Information */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-blue-900 mb-6">
                {translations[lang as keyof typeof translations]["Boat Information"]}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Boat Model"]}
                  </label>
                  <select
                    value={formData.boat_model}
                    onChange={(e) => handleInputChange("boat_model", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">-- {translations[lang as keyof typeof translations]["Select Model"]} --</option>
                    {boatModels.map((model) => (
                      <option key={model.name} value={model.name}>
                        {lang === "pt" ? model.name_pt : model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Hull Identification Number (HIN)"]}
                  </label>
                  <input
                    type="text"
                    value={formData.hull_id}
                    onChange={(e) => handleInputChange("hull_id", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Purchase Date"]}
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    {translations[lang as keyof typeof translations]["Engine Hours"]}
                  </label>
                  <input
                    type="text"
                    value={formData.engine_hours}
                    onChange={(e) => handleInputChange("engine_hours", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Service Request Details */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-blue-900 mb-6">
                {translations[lang as keyof typeof translations]["Service Request Details"]}
              </h2>
              <div className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">
                  {translations[lang as keyof typeof translations]["Request Type"]}
                </label>
                <select
                  value={formData.request_type}
                  onChange={(e) => handleInputChange("request_type", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">-- Select Request Type --</option>
                  <option value="warranty">Warranty Claim</option>
                  <option value="repair">Repair Service</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="parts">Parts Order</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  {translations[lang as keyof typeof translations]["Issue Descriptions"]}
                </label>
                {issues.map((issue, index) => (
                  <div key={index} className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <div className="flex gap-4">
                      <textarea
                        value={issue.text}
                        onChange={(e) => updateIssueText(index, e.target.value)}
                        placeholder="Describe issue"
                        className="flex-1 p-3 border border-gray-300 rounded-lg min-h-[100px]"
                        required
                      />
                      <div className="flex flex-col gap-2 items-center w-32">
                        {issue.imageUrl && (
                          <Image
                            src={issue.imageUrl || "/placeholder.svg"}
                            alt="Preview"
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        )}
                        <input
                          type="file"
                          ref={(el) => (inputFileRefs.current[index] = el)}
                          onChange={(e) => e.target.files && handleImageUpload(index, e.target.files[0])}
                          className="hidden"
                          accept="image/*"
                        />
                        <button
                          type="button"
                          onClick={() => inputFileRefs.current[index]?.click()}
                          disabled={issue.isUploading}
                          className="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                        >
                          {issue.isUploading
                            ? translations[lang as keyof typeof translations]["Uploading"]
                            : translations[lang as keyof typeof translations]["Add Image"]}
                        </button>
                        {issues.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeIssue(index)}
                            className="w-full bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                          >
                            {translations[lang as keyof typeof translations]["Remove"]}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIssue}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  {translations[lang as keyof typeof translations]["Add Issue"]}
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between">
              <Link
                href="/dealer/dashboard"
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                {translations[lang as keyof typeof translations]["Cancel"]}
              </Link>
              <button
                type="submit"
                className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                {translations[lang as keyof typeof translations]["Submit Request"]}
              </button>
            </div>
          </form>
        </div>

        {/* Service Request History */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900">
              {translations[lang as keyof typeof translations]["Service Request History"]}
            </h2>
            <button
              onClick={loadServiceRequests}
              disabled={isLoading}
              className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
            >
              {isLoading ? "Carregando..." : "🔄 Atualizar"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Request ID"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Customer"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Boat Model"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Request Type"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Date Submitted"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">
                    {translations[lang as keyof typeof translations]["Status"]}
                  </th>
                  <th className="border border-gray-300 p-4 text-left font-semibold text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 p-8 text-center text-gray-500">
                      <div className="text-4xl mb-4">🛟</div>
                      {translations[lang as keyof typeof translations]["No requests yet"]}
                    </td>
                  </tr>
                ) : (
                  serviceRequests.map((request, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-4">#{request.id}</td>
                      <td className="border border-gray-300 p-4">{request.customer}</td>
                      <td className="border border-gray-300 p-4">{request.model}</td>
                      <td className="border border-gray-300 p-4">{request.type}</td>
                      <td className="border border-gray-300 p-4">{request.date}</td>
                      <td className="border border-gray-300 p-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {request.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => showRequestDetails(request)}
                            className="text-blue-900 hover:underline text-sm"
                          >
                            {translations[lang as keyof typeof translations]["View Details"]}
                          </button>
                          <button
                            onClick={() => handleViewMessages(request)}
                            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs"
                          >
                            💬 {translations[lang as keyof typeof translations]["View Messages"]}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Service Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div ref={modalContentRef} className="p-6">
              {/* Logo Header for PDF */}
              <div className="text-center mb-6 pb-4 border-b-2 border-blue-900">
                <Image
                  src="/images/logo_drakkar.png"
                  alt="Drakkar Boats"
                  width={300}
                  height={80}
                  className="mx-auto mb-2"
                />
                <h2 className="text-2xl font-bold text-blue-900 mt-2">
                  {translations[lang as keyof typeof translations]["Service Request Details"]}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl action-buttons"
              >
                ×
              </button>

              {/* Resto do conteúdo do modal permanece igual */}
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <strong>ID:</strong> {selectedRequest.id}
                  </div>
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Date"]}:</strong> {selectedRequest.date}
                  </div>
                </div>

                <div>
                  <strong>{translations[lang as keyof typeof translations]["Status"]}:</strong>{" "}
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {selectedRequest.status}
                  </span>
                </div>

                <hr className="my-4" />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Customer"]}:</strong>{" "}
                    {selectedRequest.customer}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedRequest.customerEmail}
                  </div>
                  <div>
                    <strong>Telefone:</strong> {selectedRequest.customerPhone}
                  </div>
                  <div>
                    <strong>Endereço:</strong> {selectedRequest.customerAddress}
                  </div>
                </div>

                <hr className="my-4" />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <strong>{translations[lang as keyof typeof translations]["Boat Model"]}:</strong>{" "}
                    {selectedRequest.model}
                  </div>
                  <div>
                    <strong>Hull ID:</strong> {selectedRequest.hullId}
                  </div>
                  <div>
                    <strong>Data da Compra:</strong> {selectedRequest.purchaseDate}
                  </div>
                  <div>
                    <strong>Horas do Motor:</strong> {selectedRequest.engineHours}
                  </div>
                </div>

                <div>
                  <strong>{translations[lang as keyof typeof translations]["Request Type"]}:</strong>{" "}
                  {selectedRequest.type}
                </div>

                <div>
                  <strong>{translations[lang as keyof typeof translations]["Issues"]}:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-2">
                    {selectedRequest.issues.map((issue, index) => (
                      <li key={index} className="p-2 border rounded-md">
                        <p>{issue.text}</p>
                        {issue.imageUrl && (
                          <Image
                            src={issue.imageUrl || "/placeholder.svg"}
                            alt={`Image for ${issue.text}`}
                            width={100}
                            height={100}
                            className="mt-2 rounded-lg object-cover"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 text-center space-x-4 action-buttons">
                <button
                  onClick={handlePrint}
                  className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Print"]}
                </button>
                <button
                  onClick={handleGeneratePdf}
                  className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Generate PDF"]}
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  {translations[lang as keyof typeof translations]["Close"]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Modal */}
      {showMessageModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {translations[lang as keyof typeof translations]["Messages"]} - {selectedRequest.id}
                </h2>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingMessages ? (
                <div className="text-center py-4">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {translations[lang as keyof typeof translations]["No messages yet"]}
                </div>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender_type === "dealer" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">
                          {message.sender_type === "admin"
                            ? translations[lang as keyof typeof translations]["Administrator"]
                            : message.sender_name}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <div className="flex gap-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={translations[lang as keyof typeof translations]["Type your message..."]}
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingMessage ? "..." : translations[lang as keyof typeof translations]["Send"]}
                  </button>
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    {translations[lang as keyof typeof translations]["Cancel"]}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
