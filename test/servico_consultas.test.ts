import { describe, expect, it } from "vitest";
import { normalizeCnpj, renderPath } from "../src/features/consultas/servico.js";

describe("servico_consultas", () => {
  it("normalize_cnpj_removes_punctuation_and_requires_fourteen_digits", () => {
    expect(normalizeCnpj("00.394.460/0001-41")).toBe("00394460000141");
    expect(() => normalizeCnpj("123")).toThrow(/cnpj must contain 14 numeric digits/);
  });

  it("normalize_cnpj_rejects_non_digit_input", () => {
    expect(() => normalizeCnpj("abcdefghijklmn")).toThrow(/cnpj must contain 14 numeric digits/);
  });

  it("normalize_cnpj_rejects_wrong_length", () => {
    expect(() => normalizeCnpj("123456789012345")).toThrow(/cnpj must contain 14 numeric digits/);
  });

  it("render_path_renders_catalogued_path_parameters", () => {
    expect(
      renderPath("/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}", {
        cnpj: "00394460000141",
        ano: 2026,
        sequencial: 3,
      }),
    ).toBe("/v1/orgaos/00394460000141/compras/2026/3");
  });

  it("render_path_requires_all_placeholders", () => {
    expect(() =>
      renderPath("/v1/orgaos/{cnpj}/compras/{ano}", { cnpj: "00394460000141" }),
    ).toThrow(/ano/);
  });
});
