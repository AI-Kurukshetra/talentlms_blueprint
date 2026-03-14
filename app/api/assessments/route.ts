import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Assessments API scaffolded." }, { status: 200 })
}
