import { NextResponse } from "next/server"

// In a real app, you would store subscriptions in a database
const subscriptions = new Set<string>()

export async function POST(request: Request) {
  try {
    const subscription = await request.json()

    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: "Subscription inválida" }, { status: 400 })
    }

    // Store subscription (in a real app, save to database)
    const subscriptionKey = JSON.stringify(subscription)
    subscriptions.add(subscriptionKey)

    console.log("Nova subscription registrada:", subscription.endpoint)

    return NextResponse.json({
      success: true,
      message: "Subscription registrada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao registrar subscription:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const subscription = await request.json()

    const subscriptionKey = JSON.stringify(subscription)
    subscriptions.delete(subscriptionKey)

    return NextResponse.json({
      success: true,
      message: "Subscription removida com sucesso",
    })
  } catch (error) {
    console.error("Erro ao remover subscription:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    count: subscriptions.size,
    subscriptions: Array.from(subscriptions).map((sub) => {
      const parsed = JSON.parse(sub)
      return { endpoint: parsed.endpoint }
    }),
  })
}
