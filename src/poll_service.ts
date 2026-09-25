import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const pollRequest = z.object({
  channel: z.string().min(1),
  event: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  account_id: z.string().min(1)
});
export type PollRequest = z.infer<typeof pollRequest>;

export async function openPoll(input: PollRequest, client: InfraiClient) {
  const poll = pollRequest.parse(input);
  await client.request("/v1/realtime/channel/create", { channel: poll.channel, type: "poll", vendor: "in-house" });
  // realtime.publish is the observable handoff to connected developer tools.
  return client.request("/v1/realtime/publish", {
    channel: poll.channel,
    event: poll.event,
    data: { question: poll.question, options: poll.options },
    account_id: poll.account_id
  });
}

export function winningOption(counts: Record<string, number>): string | null {
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}
