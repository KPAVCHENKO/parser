import { describe, it, expect } from "vitest";
import {
  evalCompetitorPriceDrop,
  evalOutOfStock,
  evalPositionChange,
} from "@/server/alerts-logic";

describe("evalCompetitorPriceDrop", () => {
  it("срабатывает при падении >= порога", () => {
    expect(evalCompetitorPriceDrop(1000, 850, 10)).toEqual({
      triggered: true,
      dropPct: 15,
    });
  });

  it("не срабатывает при падении ниже порога", () => {
    expect(evalCompetitorPriceDrop(1000, 970, 10).triggered).toBe(false);
  });

  it("не срабатывает при росте цены", () => {
    expect(evalCompetitorPriceDrop(1000, 1100, null).triggered).toBe(false);
  });

  it("любое падение при пороге null", () => {
    expect(evalCompetitorPriceDrop(1000, 990, null).triggered).toBe(true);
  });

  it("безопасен при null-ценах", () => {
    expect(evalCompetitorPriceDrop(null, 100, 5).triggered).toBe(false);
    expect(evalCompetitorPriceDrop(100, null, 5).triggered).toBe(false);
  });
});

describe("evalOutOfStock", () => {
  it("срабатывает: был в наличии → стал 0", () => {
    expect(evalOutOfStock(5, 0).triggered).toBe(true);
  });
  it("не срабатывает, если уже был 0", () => {
    expect(evalOutOfStock(0, 0).triggered).toBe(false);
  });
  it("не срабатывает, если всё ещё в наличии", () => {
    expect(evalOutOfStock(5, 3).triggered).toBe(false);
  });
});

describe("evalPositionChange", () => {
  it("срабатывает при сдвиге >= N мест", () => {
    const r = evalPositionChange(10, 3, 5);
    expect(r.triggered).toBe(true);
    expect(r.delta).toBe(7);
    expect(r.improved).toBe(true);
  });
  it("определяет ухудшение позиции", () => {
    const r = evalPositionChange(3, 20, 5);
    expect(r.triggered).toBe(true);
    expect(r.improved).toBe(false);
  });
  it("не срабатывает при малом сдвиге", () => {
    expect(evalPositionChange(10, 8, 5).triggered).toBe(false);
  });
  it("безопасен при null", () => {
    expect(evalPositionChange(null, 5, 3).triggered).toBe(false);
  });
});
