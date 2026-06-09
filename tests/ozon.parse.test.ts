import { describe, it, expect } from "vitest";
import {
  parseOzonInput,
  parseOzonProductInfo,
  type OzonProductInfo,
} from "@/adapters/ozon/parse";

describe("parseOzonInput", () => {
  it("распознаёт голый SKU", () => {
    expect(parseOzonInput("1234567890")).toEqual({
      marketplace: "OZON",
      externalId: "1234567890",
    });
  });

  it("распознаёт ссылку с id в хвосте", () => {
    expect(
      parseOzonInput("https://www.ozon.ru/product/krossovki-nike-1234567890/"),
    ).toEqual({ marketplace: "OZON", externalId: "1234567890" });
  });

  it("игнорирует ссылки WB", () => {
    expect(
      parseOzonInput("https://www.wildberries.ru/catalog/123/detail.aspx"),
    ).toBeNull();
  });
});

describe("parseOzonProductInfo", () => {
  const sample: OzonProductInfo = {
    result: {
      id: 555,
      name: "Кроссовки Nike",
      offer_id: "ART-1",
      price: "7500.0000",
      old_price: "10000.0000",
      primary_image: "https://cdn.ozone.ru/img.jpg",
      stocks: { present: 12, reserved: 2 },
    },
  };

  it("нормализует цену, скидку и доступный остаток", () => {
    const card = parseOzonProductInfo(sample, "1234567890");
    expect(card.price).toBe(7500);
    expect(card.oldPrice).toBe(10000);
    expect(card.discountPct).toBe(25);
    expect(card.stock).toBe(10); // present - reserved
    expect(card.marketplace).toBe("OZON");
    expect(card.imageUrl).toContain("ozone.ru");
  });

  it("использует marketing_price при наличии", () => {
    const card = parseOzonProductInfo(
      { result: { name: "X", price: "1000", marketing_price: "800" } },
      "1",
    );
    expect(card.price).toBe(800);
  });

  it("падает, если товар пустой", () => {
    expect(() => parseOzonProductInfo({ result: {} }, "1")).toThrow();
  });
});
