import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url!, key!);

async function main() {
  console.log("Creating dummy admin user...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@dummy.com',
    password: 'admin123',
    email_confirm: true
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) {
       console.log("Admin dummy user already exists.");
       return;
    }
    console.error("Error creating user:", error);
    return;
  }
  
  const userId = data.user.id;
  console.log("User created:", userId);
  
  await supabase.from("profiles").upsert({ id: userId, role: "perawat", name: "Admin Dummy" });
  await supabase.from("nurses").upsert({ profile_id: userId, hospital: "RS Pusat" });
  
  console.log("Profile and Nurse records created.");
}

main().catch(console.error);
