import { describe, it, expect } from "vitest";
import {
  parseWbInput,
  parseWbCard,
  parseWbSearchPosition,
  buildWbImageUrl,
  type WbDetailResponse,
} from "@/adapters/wildberries/parse";

describe("parseWbInput", () => {
  it("распознаёт голый артикул", () => {
    expect(parseWbInput("12345678")).toEqual({
      marketplace: "WB",
      externalId: "12345678",
    });
  });

  it("распознаёт ссылку каталога", () => {
    expect(
      parseWbInput("https://www.wildberries.ru/catalog/176543210/detail.aspx"),
    ).toEqual({ marketplace: "WB", externalId: "176543210" });
  });

  it("возвращает null для постороннего ввода", () => {
    expect(parseWbInput("https://ozon.ru/product/abc")).toBeNull();
    expect(parseWbInput("просто текст")).toBeNull();
  });
});

describe("parseWbCard", () => {
  const sample: WbDetailResponse = {
    data: {
      products: [
        {
          id: 176543210,
          name: "Кроссовки беговые",
          brand: "Nike",
          reviewRating: 4.8,
          sizes: [
            {
              price: { basic: 1000000, product: 750000, total: 750000 },
              stocks: [{ qty: 5 }, { qty: 3 }],
            },
            { price: { basic: 1000000, product: 750000 }, stocks: [{ qty: 2 }] },
          ],
        },
      ],
    },
  };

  it("нормализует цену из копеек, скидку и остаток", () => {
    const card = parseWbCard(sample, "176543210");
    expect(card.price).toBe(7500);
    expect(card.oldPrice).toBe(10000);
    expect(card.discountPct).toBe(25);
    expect(card.stock).toBe(10);
    expect(card.rating).toBe(4.8);
    expect(card.title).toBe("Кроссовки беговые");
    expect(card.marketplace).toBe("WB");
  });

  it("падает с понятной ошибкой, если товара нет", () => {
    expect(() => parseWbCard({ data: { products: [] } }, "1")).toThrow();
  });
});

describe("parseWbSearchPosition", () => {
  it("вычисляет позицию с учётом страницы", () => {
    const json = {
      data: { products: [{ id: 111 }, { id: 222 }, { id: 333 }] },
    };
    const res = parseWbSearchPosition(json, "333", 2, 100);
    expect(res.position).toBe(103); // (2-1)*100 + index(2) + 1
    expect(res.page).toBe(2);
  });

  it("возвращает null, если не найден", () => {
    const json = { data: { products: [{ id: 111 }] } };
    expect(parseWbSearchPosition(json, "999", 1).position).toBeNull();
  });
});

describe("buildWbImageUrl", () => {
  it("строит корректный basket-URL", () => {
    const url = buildWbImageUrl("176543210");
    expect(url).toMatch(
      /^https:\/\/basket-\d{2}\.wbbasket\.ru\/vol1765\/part176543\/176543210\/images\/big\/1\.webp$/,
    );
  });
});
