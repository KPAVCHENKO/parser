import { describe, it, expect } from "vitest";
import {
  PLANS,
  getPlan,
  planPrice,
  isUpgrade,
  ANNUAL_DISCOUNT,
} from "@/lib/plans";

describe("тарифные планы", () => {
  it("лимиты соответствуют бизнес-модели", () => {
    expect(PLANS.FREE.maxProducts).toBe(5);
    expect(PLANS.FREE.refreshIntervalMinutes).toBe(1440);
    expect(PLANS.START.maxProducts).toBe(100);
    expect(PLANS.START.refreshIntervalMinutes).toBe(240);
    expect(PLANS.PRO.maxProducts).toBe(1000);
    expect(PLANS.PRO.refreshIntervalMinutes).toBe(60);
  });

  it("фичи по тарифам", () => {
    expect(PLANS.FREE.features.telegram).toBe(false);
    expect(PLANS.START.features.telegram).toBe(true);
    expect(PLANS.START.features.apiAccess).toBe(false);
    expect(PLANS.PRO.features.apiAccess).toBe(true);
    expect(PLANS.PRO.features.export).toBe(true);
  });

  it("годовая цена со скидкой 20%", () => {
    expect(planPrice("START", "MONTH")).toBe(990);
    expect(planPrice("START", "YEAR")).toBe(
      Math.round(990 * 12 * (1 - ANNUAL_DISCOUNT)),
    );
    expect(planPrice("PRO", "YEAR")).toBe(
      Math.round(2990 * 12 * (1 - ANNUAL_DISCOUNT)),
    );
  });

  it("apgrade определяется корректно", () => {
    expect(isUpgrade("FREE", "PRO")).toBe(true);
    expect(isUpgrade("PRO", "FREE")).toBe(false);
    expect(isUpgrade("START", "START")).toBe(false);
  });

  it("getPlan возвращает конфиг", () => {
    expect(getPlan("PRO").name).toBe("Pro");
  });
});
