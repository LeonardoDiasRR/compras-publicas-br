import { z } from "zod";

export type Classification =
  | "PUBLIC_USEFUL"
  | "PUBLIC_NOT_USEFUL"
  | "AUTHENTICATED"
  | "DEPRECATED"
  | "BROKEN_UPSTREAM"
  | "INTERNAL"
  | "UNKNOWN";

export interface Operation {
  id: string;
  provider: "compras" | "pncp";
  method: "GET";
  path: string;
  security: Record<string, string[]>[];
  parameters: Record<string, unknown>[];
  description: string;
  classification: Classification;
  implemented: boolean;
  tool: string | null;
  [key: string]: unknown;
}

export const OperationSchema: z.ZodType<Operation> = z
  .object({
    id: z.string(),
    provider: z.enum(["compras", "pncp"]),
    method: z.literal("GET"),
    path: z.string(),
    security: z.array(z.record(z.array(z.string()))).default([]),
    parameters: z.array(z.record(z.unknown())).default([]),
    description: z.string(),
    classification: z
      .enum([
        "PUBLIC_USEFUL",
        "PUBLIC_NOT_USEFUL",
        "AUTHENTICATED",
        "DEPRECATED",
        "BROKEN_UPSTREAM",
        "INTERNAL",
        "UNKNOWN",
      ])
      .default("UNKNOWN"),
    implemented: z.boolean().default(false),
    tool: z.string().nullable().default(null),
  })
  // ponytail: cast needed because .default() makes zod _input optional while Operation requires the fields
  .passthrough() as unknown as z.ZodType<Operation>;

export interface CoverageReport {
  public_useful: number;
  implemented: number;
  ratio: number;
  [key: string]: unknown;
}

export const CoverageReportSchema: z.ZodType<CoverageReport> = z
  .object({
    public_useful: z.number().int(),
    implemented: z.number().int(),
    ratio: z.number(),
  })
  .passthrough();

export interface McpResponse {
  source: string;
  endpoint: string;
  query: Record<string, unknown>;
  data: unknown;
  metadata: Record<string, unknown>;
  [key: string]: unknown;
}

export const McpResponseSchema: z.ZodType<McpResponse> = z
  .object({
    source: z.string(),
    endpoint: z.string(),
    query: z.record(z.unknown()).default({}),
    data: z.unknown(),
    metadata: z.record(z.unknown()).default({}),
  })
  // z.unknown() makes `data` optional in zod's output type; pydantic requires the key.
  .passthrough() as unknown as z.ZodType<McpResponse>;
