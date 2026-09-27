import type { getWorkOrderByApprovalToken } from "@/server/queries/work-orders";

type FullWorkOrder = NonNullable<Awaited<ReturnType<typeof getWorkOrderByApprovalToken>>>;

/**
 * The approval portal is public and its props are serialized into the page
 * sent to the customer's browser, so only pass what the view renders —
 * never internal notes, AI transcripts/results, or the client's private fields.
 */
export function toPublicWorkOrder(wo: FullWorkOrder) {
  return {
    number: wo.number,
    date: wo.date,
    language: wo.language,
    status: wo.status,
    summary: wo.summary,
    subtotal: wo.subtotal,
    discount: wo.discount,
    vatRate: wo.vatRate,
    vatAmount: wo.vatAmount,
    totalAmount: wo.totalAmount,
    signerName: wo.signerName,
    client: { name: wo.client.name, contactPerson: wo.client.contactPerson },
    items: wo.items.map((it) => ({
      id: it.id,
      description: it.description,
      descriptionRu: it.descriptionRu,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      discount: it.discount,
    })),
  };
}

export type PublicWorkOrder = ReturnType<typeof toPublicWorkOrder>;
