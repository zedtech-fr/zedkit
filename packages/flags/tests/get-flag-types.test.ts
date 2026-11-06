import { describe, expect, it } from "vitest";

import type { FlagReturnValue } from "#get-flag.js";

type IsWideBoolean<T> = boolean extends T ? true : false;
type IsWideNumber<T, Literal extends number> = number extends T ? true : Literal extends T ? false : true;

/** Exercised by `pnpm --filter @zedtech/zedkit-flags typecheck`. */
function typeContractChecks(): void {
  const _betaIsWide: IsWideBoolean<FlagReturnValue<false>> = true;
  const _retriesIsWide: IsWideNumber<FlagReturnValue<3>, 3> = true;
  void _betaIsWide;
  void _retriesIsWide;
}

describe("getFlag types", () => {
  it("is enforced by the package typecheck job", () => {
    expect(typeContractChecks.name).toBe("typeContractChecks");
  });
});
