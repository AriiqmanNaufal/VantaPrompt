export const detectionEvent = {
  _id: "6933dc002daccee88be60e65",
  workspaceId: "acme-123",
  userId: "user-42",
  originalHash: "37e4d98fc2df14cf48a4ca470ab4e8144e991496c37d360eabb93be86b17d2dc",
  redactedText: "Email my credit card [REDACTED:CREDIT_CARD] to [REDACTED:EMAIL]",
  rawText: "Email my credit card 4111 1111 1111 1111 to finance@example.com",
  detectedTypes: ["EMAIL", "CREDIT_CARD"],
  promptHash: "b2c739d8e7e0827a4d2c3d3f5f7b0891c7579c6dd3f4f4d2b4a5f4a6e7a7c3a2",
  originalJsonHash: "254c81b8d3e5a8c0d2c1b0f5d7a6c1e4b7c0f4d3a1b0e9d2e7f4c2d1c3a0b7e",
  findings: [
    {
      type: "EMAIL",
      fragmentHash: "af3c82544f648b38dc7d403473bb4b957cd04353afd9096fa871c1e469656c8c",
      snippet: "[REDACTED:EMAIL]",
    },
    {
      type: "CREDIT_CARD",
      fragmentHash: "6a7e0e79b018d08c9d1bb20be79999a7778399f7ee17258b3a0d36d4b4a7bec5",
      snippet: "[REDACTED:CREDIT_CARD]",
    },
  ],
  severity: "critical",
  allowed: false,
  actionTaken: "blocked",
  timestamp: "2025-12-06T07:32:16.357Z",
  source: "web",
  createdAt: "2025-12-06T07:30:00.000Z",
  updatedAt: "2025-12-06T07:35:00.000Z",
};

export const sessionInfo = {
  workstation: "macOS 14.6 (MacBook Air)",
  browser: "Chrome 120.0.0.0",
  ipAddress: "18.27.45.33",
};

export const detectionMetadata = [
  { label: "Workstation", value: sessionInfo.workstation },
  { label: "Browser", value: sessionInfo.browser },
  { label: "User ID", value: detectionEvent.userId },
  { label: "Workspace", value: detectionEvent.workspaceId },
  { label: "IP Address", value: sessionInfo.ipAddress },
];

