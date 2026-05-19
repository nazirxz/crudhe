import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await supabaseAdmin.auth.admin.deleteUser(id);
  return NextResponse.json({ success: true });
}
