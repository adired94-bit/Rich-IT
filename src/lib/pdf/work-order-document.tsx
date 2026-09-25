import "server-only";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { DOC_LABELS } from "./labels";
import type { CompanySettings } from "@/server/queries/settings";
import type { WorkOrder, WorkOrderItem, Client } from "@/db/schema";

type WorkOrderWithRelations = WorkOrder & { client: Client; items: WorkOrderItem[] };

const COLORS = {
  ink: "#0b1220",
  muted: "#5b6779",
  border: "#d7dee8",
  soft: "#f3f6fb",
  primary: "#0891b2",
  primaryDark: "#075867",
};

const styles = StyleSheet.create({
  page: { fontFamily: "Rubik", fontSize: 9.5, color: COLORS.ink, padding: 32, backgroundColor: "#ffffff" },
  section: { marginBottom: 14 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerBrand: { fontSize: 15, fontWeight: 700, color: COLORS.primaryDark },
  headerTagline: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  headerContact: { fontSize: 8, color: COLORS.muted, marginTop: 1 },
  docBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, padding: 8, minWidth: 160 },
  docTitle: { fontSize: 11, fontWeight: 700, color: COLORS.ink, marginBottom: 4 },
  docMetaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 1 },
  docMetaLabel: { fontSize: 8, color: COLORS.muted },
  docMetaValue: { fontSize: 8.5, fontWeight: 500 },
  clientBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, padding: 10, backgroundColor: COLORS.soft },
  clientName: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  clientLine: { fontSize: 8.5, color: COLORS.muted, marginTop: 1 },
  sectionLabel: { fontSize: 9.5, fontWeight: 700, color: COLORS.primaryDark, marginBottom: 5 },
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, overflow: "hidden" },
  tableHeaderRow: { backgroundColor: COLORS.primaryDark, paddingVertical: 5, paddingHorizontal: 6 },
  tableHeaderText: { fontSize: 8, fontWeight: 700, color: "#ffffff" },
  tableRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 5, paddingHorizontal: 6 },
  tableRowAlt: { backgroundColor: COLORS.soft },
  tableCellText: { fontSize: 8.5 },
  totalsBox: { width: 220, alignSelf: "flex-end", marginTop: 8 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsLabel: { fontSize: 8.5, color: COLORS.muted },
  totalsValue: { fontSize: 8.5, fontWeight: 500 },
  grandRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4, paddingTop: 4 },
  grandLabel: { fontSize: 10, fontWeight: 700 },
  grandValue: { fontSize: 11, fontWeight: 700, color: COLORS.primaryDark },
  paragraph: { fontSize: 9, lineHeight: 1.5, color: COLORS.ink },
  termsText: { fontSize: 7.5, lineHeight: 1.4, color: COLORS.muted },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, gap: 16 },
  signBox: { flex: 1, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 6, alignItems: "stretch" },
  signImage: { width: 130, height: 45, objectFit: "contain", marginBottom: 4, alignSelf: "center" },
  signLabel: { fontSize: 8, color: COLORS.muted, textAlign: "center" },
  signedNote: { fontSize: 7.5, color: COLORS.primaryDark, marginTop: 2, textAlign: "center" },
  footer: { position: "absolute", bottom: 18, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: COLORS.muted },
  divider: { borderTopWidth: 1, borderTopColor: COLORS.border, borderStyle: "dashed", marginVertical: 16 },
});

function fmtMoney(n: number, lang: "he" | "ru") {
  return new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
}
function fmtDate(d: Date | string, lang: "he" | "ru") {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

const LABELS = DOC_LABELS;

/**
 * @react-pdf/renderer's text engine (@react-pdf/textkit) runs a real UAX#9
 * bidi algorithm internally (via bidi-js) — it reorders glyphs correctly on
 * its own. All that's needed from us is `direction: "rtl"` on each Hebrew
 * Text node (so neutrals/numbers resolve against the right base direction)
 * plus right alignment; manual string reversal would only double-reverse it.
 */
function textDir(lang: "he" | "ru"): { direction: "rtl" | "ltr" } {
  return { direction: lang === "he" ? "rtl" : "ltr" };
}

function ItemsTable({ wo, lang }: { wo: WorkOrderWithRelations; lang: "he" | "ru" }) {
  const t = LABELS[lang];
  const isHe = lang === "he";
  const rowDir: "row" | "row-reverse" = isHe ? "row-reverse" : "row";
  const align: "right" | "left" = isHe ? "right" : "left";
  const dir = textDir(lang);

  return (
    <View style={styles.table}>
      <View style={[styles.tableHeaderRow, { flexDirection: rowDir }]}>
        <Text style={[styles.tableHeaderText, dir, { flex: 3, textAlign: align }]}>{t.description}</Text>
        <Text style={[styles.tableHeaderText, dir, { flex: 1, textAlign: "center" }]}>{t.qty}</Text>
        <Text style={[styles.tableHeaderText, dir, { flex: 1.3, textAlign: "center" }]}>{t.unitPrice}</Text>
        <Text style={[styles.tableHeaderText, dir, { flex: 1.3, textAlign: "center" }]}>{t.total}</Text>
      </View>
      {wo.items.map((item, i) => {
        const desc = isHe ? item.description : item.descriptionRu || item.description;
        const total = Math.max(0, item.quantity * item.unitPrice - item.discount);
        return (
          <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : undefined, { flexDirection: rowDir }]}>
            <Text style={[styles.tableCellText, dir, { flex: 3, textAlign: align }]}>{desc}</Text>
            <Text style={[styles.tableCellText, { flex: 1, textAlign: "center" }]}>{item.quantity} {item.unit}</Text>
            <Text style={[styles.tableCellText, { flex: 1.3, textAlign: "center" }]}>{fmtMoney(item.unitPrice, lang)}</Text>
            <Text style={[styles.tableCellText, { flex: 1.3, textAlign: "center", fontWeight: 700 }]}>{fmtMoney(total, lang)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function LanguageSection({ wo, lang, company }: { wo: WorkOrderWithRelations; lang: "he" | "ru"; company: CompanySettings }) {
  const t = LABELS[lang];
  const isHe = lang === "he";
  const align: "right" | "left" = isHe ? "right" : "left";
  const rowDir: "row" | "row-reverse" = isHe ? "row-reverse" : "row";
  const dir = textDir(lang);
  const ai = wo.aiResult as { summaryRu?: string } | null;
  const summary = isHe ? wo.summary : ai?.summaryRu || wo.summary;

  return (
    <View>
      <View style={[styles.rowBetween, { flexDirection: rowDir }]}>
        <View>
          <Text style={[styles.headerBrand, dir]}>{company.name}</Text>
          <Text style={[styles.headerTagline, dir, { textAlign: align }]}>{company.tagline[lang]}</Text>
          {company.phone && <Text style={[styles.headerContact, dir, { textAlign: align }]}>{t.phone}: {company.phone}</Text>}
          {company.email && <Text style={[styles.headerContact, { textAlign: align }]}>{company.email}</Text>}
          {company.vatId && <Text style={[styles.headerContact, dir, { textAlign: align }]}>{t.vatId}: {company.vatId}</Text>}
        </View>
        <View style={styles.docBox}>
          <Text style={[styles.docTitle, dir, { textAlign: align }]}>{t.title}</Text>
          <View style={[styles.docMetaRow, { flexDirection: rowDir }]}>
            <Text style={[styles.docMetaLabel, dir]}>{t.docNumber}</Text>
            <Text style={styles.docMetaValue}>{wo.number}</Text>
          </View>
          <View style={[styles.docMetaRow, { flexDirection: rowDir }]}>
            <Text style={[styles.docMetaLabel, dir]}>{t.date}</Text>
            <Text style={styles.docMetaValue}>{fmtDate(wo.date, lang)}</Text>
          </View>
          {wo.performerName && (
            <View style={[styles.docMetaRow, { flexDirection: rowDir }]}>
              <Text style={[styles.docMetaLabel, dir]}>{t.performer}</Text>
              <Text style={[styles.docMetaValue, dir]}>{wo.performerName}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.section, styles.clientBox, { marginTop: 14 }]}>
        <Text style={[styles.clientName, dir, { textAlign: align }]}>{wo.client.name}</Text>
        {wo.client.contactPerson && <Text style={[styles.clientLine, dir, { textAlign: align }]}>{t.contact}: {wo.client.contactPerson}</Text>}
        {wo.client.phone && <Text style={[styles.clientLine, dir, { textAlign: align }]}>{t.phone}: {wo.client.phone}</Text>}
        {wo.client.address && <Text style={[styles.clientLine, dir, { textAlign: align }]}>{t.address}: {wo.client.address}</Text>}
      </View>

      <View style={styles.section}>
        <ItemsTable wo={wo} lang={lang} />
        <View style={styles.totalsBox}>
          <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
            <Text style={[styles.totalsLabel, dir]}>{t.subtotal}</Text>
            <Text style={styles.totalsValue}>{fmtMoney(wo.subtotal, lang)}</Text>
          </View>
          {wo.discount > 0 && (
            <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
              <Text style={[styles.totalsLabel, dir]}>{t.discount}</Text>
              <Text style={styles.totalsValue}>-{fmtMoney(wo.discount, lang)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
            <Text style={[styles.totalsLabel, dir]}>{t.vat(wo.vatRate)}</Text>
            <Text style={styles.totalsValue}>{fmtMoney(wo.vatAmount, lang)}</Text>
          </View>
          <View style={[styles.grandRow, { flexDirection: rowDir }]}>
            <Text style={[styles.grandLabel, dir]}>{t.grandTotal}</Text>
            <Text style={styles.grandValue}>{fmtMoney(wo.totalAmount, lang)}</Text>
          </View>
        </View>
      </View>

      {summary && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, dir, { textAlign: align }]}>{t.summary}</Text>
          <Text style={[styles.paragraph, dir, { textAlign: align }]}>{summary}</Text>
        </View>
      )}
      {wo.nextSteps && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, dir, { textAlign: align }]}>{t.nextSteps}</Text>
          <Text style={[styles.paragraph, dir, { textAlign: align }]}>{wo.nextSteps}</Text>
        </View>
      )}
      {wo.timeSpentMinutes > 0 && (
        <Text style={[styles.paragraph, dir, { textAlign: align, marginTop: -6, marginBottom: 10 }]}>
          {t.timeSpent}: {Math.round((wo.timeSpentMinutes / 60) * 100) / 100} {t.hours}
        </Text>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, dir, { fontSize: 8, textAlign: align }]}>{t.terms}</Text>
        <Text style={[styles.termsText, dir, { textAlign: align }]}>{t.termsText}</Text>
      </View>

      <View style={[styles.signRow, { flexDirection: rowDir }]}>
        <View style={styles.signBox}>
          {wo.signatureUrl && wo.status === "signed" ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF drawing primitive, not an HTML <img>; it has no alt prop. */}
              <Image src={wo.signatureUrl} style={styles.signImage} />
              <Text style={[styles.signLabel, dir]}>{t.clientSignature}{wo.signerName ? ` — ${wo.signerName}` : ""}</Text>
              {wo.signedAt && <Text style={[styles.signedNote, dir]}>{t.signedDigitally(fmtDate(wo.signedAt, lang))}</Text>}
            </>
          ) : (
            <Text style={[styles.signLabel, dir]}>{t.clientSignature}</Text>
          )}
        </View>
        <View style={styles.signBox}>
          <Text style={[styles.signLabel, dir]}>{t.engineerSignature}{wo.performerName ? ` — ${wo.performerName}` : ""}</Text>
        </View>
      </View>
    </View>
  );
}

export function WorkOrderPdfDocument({ workOrder, company }: { workOrder: WorkOrderWithRelations; company: CompanySettings }) {
  const languages: ("he" | "ru")[] = workOrder.language === "dual" ? ["he", "ru"] : workOrder.language === "ru" ? ["ru"] : ["he"];

  return (
    <Document title={`${workOrder.number} — ${company.name}`}>
      <Page size="A4" style={styles.page} wrap>
        {languages.map((lang, i) => (
          <React.Fragment key={lang}>
            {i > 0 && <View style={styles.divider} />}
            <LanguageSection wo={workOrder} lang={lang} company={company} />
          </React.Fragment>
        ))}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{company.name}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
