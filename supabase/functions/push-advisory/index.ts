import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * push-advisory: Reads unread advisories and broadcasts them via
 * Supabase Realtime to each affected user's channel.
 *
 * Triggered manually (HTTP POST) or via pg_cron.
 * Does NOT use FCM — Realtime broadcast only.
 */
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // 1. Fetch advisories not yet broadcast
    const { data: advisories, error: advError } = await supabase
      .from("advisories")
      .select("*")
      .neq("broadcast_sent", true) // rows without broadcast_sent = true
      .order("created_at", { ascending: false })
      .limit(20);

    if (advError) {
      throw new Error(`Failed to fetch advisories: ${advError.message}`);
    }

    if (!advisories || advisories.length === 0) {
      return new Response(
        JSON.stringify({ message: "No unbroadcast advisories found." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch user IDs from profiles in affected states/districts
    const broadcastResults: string[] = [];

    for (const advisory of advisories) {
      const targetStates: string[] = advisory.target_states || [];
      const targetDistricts: string[] = advisory.target_districts || [];

      // Get users in matching states or districts
      let usersQuery = supabase.from("profiles").select("id");
      if (targetStates.length > 0) {
        usersQuery = usersQuery.in("state", targetStates);
      }
      const { data: users } = await usersQuery.limit(500);

      if (!users || users.length === 0) {
        broadcastResults.push(`advisory:${advisory.id} — no matching users`);
        continue;
      }

      const payload = {
        type: "advisory",
        advisory: {
          id: advisory.id,
          title: advisory.title,
          body: advisory.body,
          severity: advisory.severity,
        },
      };

      // 3. Broadcast to each user's private channel
      for (const user of users) {
        const channel = supabase.channel(`advisories:${user.id}`);
        await channel.send({
          type: "broadcast",
          event: "new_advisory",
          payload,
        });
      }

      // 4. Mark advisory as broadcast_sent: true
      const { error: updateError } = await supabase
        .from("advisories")
        .update({ broadcast_sent: true } as Record<string, unknown>)
        .eq("id", advisory.id);

      if (updateError) {
        console.error(`Failed to mark advisory ${advisory.id} as sent:`, updateError.message);
      }

      broadcastResults.push(
        `advisory:${advisory.id} broadcast to ${users.length} users`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: advisories.length,
        results: broadcastResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("push-advisory error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
