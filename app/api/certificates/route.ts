import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Certificates API scaffolded." }, { status: 200 })
}
