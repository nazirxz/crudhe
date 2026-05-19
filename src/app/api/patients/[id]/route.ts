import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get patient to find profile_id
  const { data: patient } = await supabaseAdmin
    .from("patients")
    .select("profile_id")
    .eq("id", id)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete patient (cascade handles session_records, etc.)
  await supabaseAdmin.from("patients").delete().eq("id", id);

  // Optionally delete auth user
  await supabaseAdmin.auth.admin.deleteUser(patient.profile_id);

  return NextResponse.json({ success: true });
}
