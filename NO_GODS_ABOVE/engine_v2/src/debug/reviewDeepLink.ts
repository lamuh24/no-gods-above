export type ReviewDeepLinkResolution =
  | { kind: "special"; id: string; reason: null }
  | { kind: "throw"; id: string; reason: null }
  | { kind: "none"; id: null; reason: "not_requested" | "ambiguous" | "invalid_special" | "invalid_throw" };

export function resolveReviewDeepLink(
  search: string,
  allowedSpecialScenarioIds: readonly string[],
  allowedThrowScenarioIds: readonly string[]
): ReviewDeepLinkResolution {
  const params = new URLSearchParams(search);
  const requestedSpecials = params.getAll("specialScenario").filter(Boolean);
  const requestedThrows = params.getAll("throwScenario").filter(Boolean);

  if (requestedSpecials.length + requestedThrows.length === 0) return { kind: "none", id: null, reason: "not_requested" };
  if (requestedSpecials.length !== 0 && requestedThrows.length !== 0) return { kind: "none", id: null, reason: "ambiguous" };
  if (requestedSpecials.length > 1 || requestedThrows.length > 1) return { kind: "none", id: null, reason: "ambiguous" };
  if (requestedSpecials.length === 1) {
    const id = requestedSpecials[0];
    return allowedSpecialScenarioIds.includes(id)
      ? { kind: "special", id, reason: null }
      : { kind: "none", id: null, reason: "invalid_special" };
  }
  const id = requestedThrows[0];
  return allowedThrowScenarioIds.includes(id)
    ? { kind: "throw", id, reason: null }
    : { kind: "none", id: null, reason: "invalid_throw" };
}
