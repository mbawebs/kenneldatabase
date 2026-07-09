"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "success" | "error";

export default function TestPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadKennels() {
      const supabase = createClient();
      const { data, error } = await supabase.from("kennels").select("*");

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      setRowCount(data.length);
      setStatus("success");
    }

    loadKennels();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Supabase connection test</h1>

      {status === "loading" && <p>Connecting to Supabase...</p>}

      {status === "success" && (
        <div className="rounded-lg border border-green-500 bg-green-50 p-4 text-green-800">
          <p className="font-semibold">✅ Connection successful</p>
          <p>
            The <code>kennels</code> table responded without errors. Rows
            found: <strong>{rowCount}</strong>
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">❌ Connection error</p>
          <p>{errorMessage}</p>
        </div>
      )}
    </main>
  );
}
