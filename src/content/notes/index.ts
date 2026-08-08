import type { NoteContent } from "@/lib/note-content";
import bunHonoUsage from "./bun-hono-usage";
import sseBackfillInfiniteLoop from "./sse-backfill-infinite-loop";
import ssoKmsSequence from "./sso-kms-sequence";
import legacyCookieCompatibility from "./legacy-cookie-compatibility";
import migrationFlow from "./migration-flow";
import snsLinkingFlow from "./sns-linking-flow";
import crossChainBridge from "./cross-chain-bridge";
import kingdomscanIndexer from "./kingdomscan-indexer";
import monorepoStructure from "./monorepo-structure";
import randomBoxVrf from "./random-box-vrf";
import nftMintAndPurchaseSync from "./nft-mint-and-purchase-sync";
import nftMarketplacePurchaseFlow from "./nft-marketplace-purchase-flow";
import paymentFlows from "./payment-flows";
import questAttendanceSwapFlow from "./quest-attendance-swap-flow";

export const noteContent: Record<string, NoteContent> = {
  "bun-hono-usage": bunHonoUsage,
  "sse-backfill-infinite-loop": sseBackfillInfiniteLoop,
  "sso-kms-sequence": ssoKmsSequence,
  "legacy-cookie-compatibility": legacyCookieCompatibility,
  "migration-flow": migrationFlow,
  "sns-linking-flow": snsLinkingFlow,
  "cross-chain-bridge": crossChainBridge,
  "kingdomscan-indexer": kingdomscanIndexer,
  "monorepo-structure": monorepoStructure,
  "random-box-vrf": randomBoxVrf,
  "nft-mint-and-purchase-sync": nftMintAndPurchaseSync,
  "nft-marketplace-purchase-flow": nftMarketplacePurchaseFlow,
  "payment-flows": paymentFlows,
  "quest-attendance-swap-flow": questAttendanceSwapFlow,
};
