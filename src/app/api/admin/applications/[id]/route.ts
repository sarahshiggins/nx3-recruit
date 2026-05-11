import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { id } = await params;
  const body = await req.json();

  // Only allow updating stage
  const { stage } = body;

  if (!stage) {
    return NextResponse.json({ error: "Missing stage" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ stage })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
