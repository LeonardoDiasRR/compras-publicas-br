from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Classification = Literal[
    "PUBLIC_USEFUL",
    "PUBLIC_NOT_USEFUL",
    "AUTHENTICATED",
    "DEPRECATED",
    "BROKEN_UPSTREAM",
    "INTERNAL",
    "UNKNOWN",
]


class Operation(BaseModel):
    model_config = ConfigDict(extra="allow")  # Preserve unknown upstream fields.

    id: str
    provider: Literal["compras", "pncp"]
    method: Literal["GET"]
    path: str
    security: list[dict[str, list[str]]] = Field(default_factory=list)  # pyright: ignore[reportUnknownVariableType]
    parameters: list[dict[str, Any]] = Field(default_factory=list)  # pyright: ignore[reportUnknownVariableType]
    description: str
    classification: Classification = "UNKNOWN"
    implemented: bool = False
    tool: str | None = None


class CoverageReport(BaseModel):
    model_config = ConfigDict(extra="allow")  # Preserve unknown upstream fields.

    public_useful: int
    implemented: int
    ratio: float


class McpResponse(BaseModel):
    model_config = ConfigDict(extra="allow")  # Preserve unknown upstream fields.

    source: str
    endpoint: str
    query: dict[str, Any] = Field(default_factory=dict)
    data: Any
    metadata: dict[str, Any] = Field(default_factory=dict)
