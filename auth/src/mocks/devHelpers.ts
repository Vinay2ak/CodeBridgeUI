import { setIdentityDown } from "./handlers/identity";
import { setTalentDown, setGithubDown, setForcedFieldError } from "./state";

type Service = "identity" | "talent" | "github";

export function installDevHelpers(): void {
  const helpers = {
    serviceDown(service: Service, down: boolean): void {
      if (service === "identity") setIdentityDown(down);
      else if (service === "talent") setTalentDown(down);
      else if (service === "github") setGithubDown(down);
    },
    forceFieldError(field: string): void {
      setForcedFieldError(field);
    },
  };
  (window as unknown as Record<string, unknown>).__cbMock = helpers;
}
