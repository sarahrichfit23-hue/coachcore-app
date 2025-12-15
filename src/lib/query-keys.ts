export const coachClientsQueryKey = ["coachClients"] as const;
export const coachStatsQueryKey = ["coachStats"] as const;
export const coachClientProgressKey = (clientId: string) =>
  ["coachClientProgress", clientId] as const;
export const clientProgressQueryKey = ["clientProgress"] as const;
export const adminCoachesQueryKey = ["adminCoaches"] as const;
export const adminStatsQueryKey = ["adminStats"] as const;
