import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { records } = body as { records: Record<string, unknown>[] };

  const { data, error } = await supabaseAdmin
    .from("session_records")
    .insert(records)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const { id, updates } = await request.json();
  const { error } = await supabaseAdmin.from("session_records").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");
  const id = searchParams.get("id");

  if (id) {
    // Delete reflection_answers first
    await supabaseAdmin.from("reflection_answers").delete().eq("session_id", id);
    const { error } = await supabaseAdmin.from("session_records").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (patientId) {
    // Get all record ids for this patient to delete reflection_answers
    const { data: recs } = await supabaseAdmin.from("session_records").select("id").eq("patient_id", patientId);
    if (recs && recs.length > 0) {
      await supabaseAdmin.from("reflection_answers").delete().in("session_id", recs.map(r => r.id));
    }
    const { error } = await supabaseAdmin.from("session_records").delete().eq("patient_id", patientId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
