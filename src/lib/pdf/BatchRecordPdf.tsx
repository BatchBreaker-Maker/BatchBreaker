import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { fetchBatchForPdf } from './fetchBatchForPdf'
import { CHECKLIST_ITEM_LABELS, CHECKLIST_ITEM_ORDER } from '@/lib/workflow/checklistItems'
import { HOMOGENEITY_ITEM_LABELS, HOMOGENEITY_ITEM_ORDER } from '@/lib/workflow/inProcessLabels'
import { PRE_PACKAGING_ITEM_LABELS, PRE_PACKAGING_ITEM_ORDER } from '@/lib/workflow/packagingLabels'
import { EQUIPMENT_ROW_LABELS, EQUIPMENT_ROW_ORDER } from '@/lib/workflow/equipmentLabels'
import { COMPLETENESS_ITEM_LABELS, COMPLETENESS_ITEM_ORDER } from '@/lib/workflow/completenessLabels'

export type BatchForPdf = NonNullable<Awaited<ReturnType<typeof fetchBatchForPdf>>>

const styles = StyleSheet.create({
  page: { padding: 32, paddingBottom: 40, fontSize: 9, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#555555', marginBottom: 14 },
  section: { marginBottom: 12 },
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#eeeeee',
    padding: 4,
    marginBottom: 5,
  },
  subheading: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 6, marginBottom: 3 },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { width: 170, color: '#555555' },
  value: { flex: 1 },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #000000',
    paddingBottom: 2,
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: { flexDirection: 'row', borderBottom: '0.5 solid #cccccc', paddingVertical: 2 },
  cell: { flex: 1, paddingRight: 4 },
  empty: { color: '#999999', fontStyle: 'italic' },
})

function fmtDate(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : '—'
}
function fmtDateTime(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 16).replace('T', ' ') : '—'
}
function fmtBool(b: boolean | null | undefined): string {
  return b == null ? '—' : b ? 'Yes' : 'No'
}
function fmtVal(v: unknown): string {
  return v == null || v === '' ? '—' : String(v)
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <Text style={styles.sectionHeading}>
      Section {number} — {title}
    </Text>
  )
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>
}

function TableHeader({ labels }: { labels: string[] }) {
  return (
    <View style={styles.tableHeaderRow}>
      {labels.map((l, i) => (
        <Text key={i} style={styles.cell}>
          {l}
        </Text>
      ))}
    </View>
  )
}

function TableRow({ values }: { values: string[] }) {
  return (
    <View style={styles.tableRow}>
      {values.map((v, i) => (
        <Text key={i} style={styles.cell}>
          {v}
        </Text>
      ))}
    </View>
  )
}

export function BatchRecordPdf({ batch }: { batch: BatchForPdf }) {
  const preCut = batch.cureRecords.find((c) => c.phase === 'PRE_CUT')
  const postCut = batch.cureRecords.find((c) => c.phase === 'POST_CUT')
  const checklistSignoff = batch.checklistItems.find((i) => i.hopSignoffUserId)
  const completenessSignoff = batch.completenessReviewItems.find((i) => i.hopSignatureUserId)

  return (
    <Document title={`Batch Record — ${batch.batchNumber}`}>
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.title}>Batch Production Record — {batch.batchNumber}</Text>
        <Text style={styles.subtitle}>
          {batch.productName} — status: {batch.status.replaceAll('_', ' ')} — generated{' '}
          {new Date().toISOString().slice(0, 10)}
        </Text>

        {/* Section 1 */}
        <View style={styles.section}>
          <SectionHeading number={1} title="Batch Identification" />
          <Field label="Batch Number" value={batch.batchNumber} />
          <Field label="Product Name" value={batch.productName} />
          <Field label="Product Code / SKU" value={fmtVal(batch.productCodeSku)} />
          <Field label="Product Type" value={batch.productType.replaceAll('_', ' ')} />
          <Field label="Finished Product Spec Ref" value={fmtVal(batch.finishedProductSpecRef)} />
          <Field label="Formula #" value={batch.formulaNumber} />
          <Field label="Formula Version" value={batch.formulaVersion} />
          <Field label="Batch Size (target)" value={`${batch.batchSizeTarget.toString()} ${batch.batchSizeUnit}`} />
          <Field label="Production Date" value={fmtDate(batch.productionDate)} />
          <Field label="Planned Completion Date" value={fmtDate(batch.plannedCompletionDate)} />
          <Field label="Manufacturing Site / Room" value={fmtVal(batch.manufacturingSiteRoom)} />
          <Field label="Complaint / Recall Ref" value={fmtVal(batch.complaintRecallRef)} />
          <Field label="Adverse Event Ref" value={fmtVal(batch.adverseEventRef)} />
          <Field label="Record Retention Deadline" value={fmtDate(batch.retentionDeadline)} />
          <Field label="Created By" value={`${batch.createdBy.fullName} on ${fmtDate(batch.createdAt)}`} />
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <SectionHeading number={2} title="Production Personnel" />
          <Field
            label="Production Operator(s)"
            value={batch.productionOperatorNames.length > 0 ? batch.productionOperatorNames.join(', ') : '—'}
          />
          <Field label="Head of Production" value={fmtVal(batch.headOfProductionName)} />
          <Field label="QC Reviewer" value={fmtVal(batch.qcReviewerName)} />
        </View>

        {/* Section 3 */}
        <View style={styles.section} break>
          <SectionHeading number={3} title="Pre-Production Checklist" />
          <TableHeader labels={['Item', 'Verified']} />
          {CHECKLIST_ITEM_ORDER.map((key) => {
            const item = batch.checklistItems.find((i) => i.itemKey === key)
            return <TableRow key={key} values={[CHECKLIST_ITEM_LABELS[key], fmtBool(item?.verified)]} />
          })}
          {checklistSignoff ? (
            <Text style={{ marginTop: 4 }}>
              Signed off by {checklistSignoff.hopSignoffUser?.fullName} on {fmtDate(checklistSignoff.hopSignoffDate)}
            </Text>
          ) : (
            <Empty text="Not yet signed off." />
          )}
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <SectionHeading number={4} title="Raw Material Log" />
          {batch.rawMaterialEntries.length === 0 ? (
            <Empty text="No raw material entries recorded yet." />
          ) : (
            <>
              <TableHeader labels={['#', 'Trade Name', 'Supplier', 'Lot #', 'Qty', 'COA', 'Qual. Status']} />
              {batch.rawMaterialEntries.map((e) => (
                <TableRow
                  key={e.id}
                  values={[
                    String(e.lineNumber),
                    e.tradeNameDescription,
                    e.supplierName,
                    e.supplierLotBatchNumber,
                    `${e.qtyDispensed.toString()} ${e.unit}`,
                    fmtBool(e.coaReceived),
                    e.supplierQualStatus,
                  ]}
                />
              ))}
            </>
          )}
        </View>

        {/* Section 5 */}
        <View style={styles.section}>
          <SectionHeading number={5} title="Raw Material Temperatures" />
          {batch.temperatureEntries.length === 0 ? (
            <Empty text="No temperature entries recorded yet." />
          ) : (
            <>
              <TableHeader labels={['#', 'Material', 'Range (°F)', 'Actual (°F)', 'In Range?', 'Time']} />
              {batch.temperatureEntries.map((e) => (
                <TableRow
                  key={e.id}
                  values={[
                    String(e.lineNumber),
                    e.materialIngredient,
                    `${e.acceptableTempMinF.toString()}–${e.acceptableTempMaxF.toString()}`,
                    e.actualTempF.toString(),
                    e.withinRange ? 'Yes' : 'OUT OF RANGE',
                    fmtDateTime(e.timeOfAddition),
                  ]}
                />
              ))}
            </>
          )}
        </View>

        {/* Section 6 */}
        <View style={styles.section} break>
          <SectionHeading number={6} title="In-Process Production Record" />
          <Text style={styles.subheading}>6.1 — Processing Steps</Text>
          {batch.processingSteps.length === 0 ? (
            <Empty text="No processing steps recorded yet." />
          ) : (
            <>
              <TableHeader labels={['Step', 'Description', 'Time', 'Notes']} />
              {batch.processingSteps.map((s) => (
                <TableRow
                  key={s.id}
                  values={[String(s.stepNumber), s.stepDescription, fmtDateTime(s.timePerformed), fmtVal(s.observationsNotes)]}
                />
              ))}
            </>
          )}

          <Text style={styles.subheading}>6.2 — Visual Homogeneity &amp; Consistency Checks</Text>
          <TableHeader labels={['Item', 'Result', 'Comments']} />
          {HOMOGENEITY_ITEM_ORDER.map((key) => {
            const c = batch.homogeneityChecks.find((h) => h.checkItem === key)
            return <TableRow key={key} values={[HOMOGENEITY_ITEM_LABELS[key], fmtVal(c?.result), fmtVal(c?.comments)]} />
          })}

          <Text style={styles.subheading}>6.3 — Cure/Hold Record (Pre-Cut)</Text>
          <Field label="Date/Time Poured into Molds" value={fmtDateTime(preCut?.dateTimeStart)} />
          <Field label="Target Cure Duration" value={fmtVal(preCut?.targetCureDuration)} />
          <Field label="Date/Time Removed from Molds" value={fmtDateTime(preCut?.dateTimeRemoved)} />
          <Field label="Curing Location / Conditions" value={fmtVal(preCut?.curingLocationConditions)} />
          <Field label="Cure Period Acceptable" value={fmtBool(preCut?.curePeriodAcceptable)} />

          <Text style={styles.subheading}>6.4 — Cure/Hold Record (Post-Cut)</Text>
          <Field label="Date/Time Cut" value={fmtDateTime(postCut?.dateTimeStart)} />
          <Field label="Curing Location / Conditions" value={fmtVal(postCut?.curingLocationConditions)} />
          <Field label="Cure Period Acceptable" value={fmtBool(postCut?.curePeriodAcceptable)} />
          <Field label="pH Measured" value={fmtDateTime(postCut?.phMeasurementDateTime)} />
          <Field label="pH Result" value={fmtVal(postCut?.phResult?.toString())} />
          <Field label="Free Caustic Check Method" value={fmtVal(postCut?.freeCausticCheckMethod)} />
          <Field label="Free Caustic Check Result" value={fmtVal(postCut?.freeCausticCheckResult)} />
        </View>

        {/* Section 7 */}
        <View style={styles.section}>
          <SectionHeading number={7} title="Soap Block Cutting Observations" />
          {batch.cuttingObservations.length === 0 ? (
            <Empty text="No cutting observations recorded yet." />
          ) : (
            <>
              <TableHeader labels={['Pour', 'Top', 'Side', 'Middle', 'Color', 'Separation?', 'Foreign Matter?']} />
              {batch.cuttingObservations.map((o) => (
                <TableRow
                  key={o.id}
                  values={[
                    String(o.pourNumber),
                    fmtVal(o.tempTopF?.toString()),
                    fmtVal(o.tempSideF?.toString()),
                    fmtVal(o.tempMiddleF?.toString()),
                    fmtVal(o.colorUniformity),
                    o.visibleSeparation ? 'Yes' : 'No',
                    o.foreignMatter ? 'Yes' : 'No',
                  ]}
                />
              ))}
            </>
          )}
          <Field label="Overall Comments" value={fmtVal(batch.cuttingOverallComments)} />
        </View>

        {/* Section 8 */}
        <View style={styles.section} break>
          <SectionHeading number={8} title="Bar Stamping / Press Operations" />
          <Text style={styles.subheading}>8.1 — Stamping Setup</Text>
          {batch.stampingSetup ? (
            <>
              <Field label="Die / Stamp ID" value={batch.stampingSetup.dieStampId} />
              <Field label="Die Condition Inspected" value={fmtBool(batch.stampingSetup.dieConditionInspected)} />
              <Field label="Setup Date" value={fmtDate(batch.stampingSetup.setupDate)} />
              <Field label="Total Bars Stamped" value={fmtVal(batch.stampingSetup.totalBarsStamped)} />
              <Field label="Total Bars Rejected" value={fmtVal(batch.stampingSetup.totalBarsRejected)} />
            </>
          ) : (
            <Empty text="Not yet recorded." />
          )}

          <Text style={styles.subheading}>8.2 — Press Log</Text>
          {batch.pressRuns.length === 0 ? (
            <Empty text="No press runs recorded yet." />
          ) : (
            <>
              <TableHeader labels={['Date/Time', 'Die/Stamp ID', 'Impression Quality', 'Surface Condition', 'Appearance OK?']} />
              {batch.pressRuns.map((r) => (
                <TableRow
                  key={r.id}
                  values={[
                    fmtDateTime(r.dateTime),
                    r.dieStampId,
                    fmtVal(r.impressionQuality),
                    fmtVal(r.barSurfaceCondition),
                    fmtBool(r.appearanceOk),
                  ]}
                />
              ))}
            </>
          )}
        </View>

        {/* Section 9 */}
        <View style={styles.section}>
          <SectionHeading number={9} title="In-Process Sampling Log" />
          {batch.samplingEntries.length === 0 ? (
            <Empty text="No sampling entries recorded yet." />
          ) : (
            <>
              <TableHeader labels={['Date/Time', 'Stage', 'Test Type', 'Result', 'Disposition']} />
              {batch.samplingEntries.map((s) => (
                <TableRow
                  key={s.id}
                  values={[
                    fmtDateTime(s.dateTime),
                    s.samplingStage,
                    s.testType,
                    fmtVal(s.resultObservation),
                    s.disposition.replaceAll('_', ' '),
                  ]}
                />
              ))}
            </>
          )}
        </View>

        {/* Section 10 */}
        <View style={styles.section}>
          <SectionHeading number={10} title="Yield Reconciliation" />
          {batch.yieldReconciliation ? (
            <>
              <Field
                label="Expected Yield"
                value={`${batch.yieldReconciliation.expectedYield.toString()} ${batch.yieldReconciliation.expectedYieldUnit}`}
              />
              <Field
                label="Actual Yield"
                value={`${batch.yieldReconciliation.actualYield.toString()} ${batch.yieldReconciliation.actualYieldUnit}`}
              />
              <Field label="Variance Acceptable" value={fmtBool(batch.yieldReconciliation.varianceAcceptable)} />
              <Field label="Investigation Initiated" value={fmtBool(batch.yieldReconciliation.investigationInitiated)} />
              <Field label="Notes / Disposition" value={fmtVal(batch.yieldReconciliation.notesDisposition)} />
            </>
          ) : (
            <Empty text="Not yet recorded." />
          )}
        </View>

        {/* Section 11 */}
        <View style={styles.section} break>
          <SectionHeading number={11} title="Packaging Operations" />
          <Text style={styles.subheading}>11.1 — Pre-Packaging Checklist</Text>
          <TableHeader labels={['Item', 'Verified']} />
          {PRE_PACKAGING_ITEM_ORDER.map((key) => {
            const item = batch.prePackagingChecklistItems.find((i) => i.itemKey === key)
            return <TableRow key={key} values={[PRE_PACKAGING_ITEM_LABELS[key], fmtBool(item?.verified)]} />
          })}

          <Text style={styles.subheading}>11.2 — In-Process Packaging Checks</Text>
          {batch.packagingChecks.length === 0 ? (
            <Empty text="No in-process checks recorded yet." />
          ) : (
            <>
              <TableHeader labels={['#', 'Time', 'Component', 'Label', 'Appearance', 'Fill/Weight']} />
              {batch.packagingChecks.map((c) => (
                <TableRow
                  key={c.id}
                  values={[
                    String(c.checkNumber),
                    fmtDateTime(c.time),
                    fmtBool(c.componentCorrect),
                    fmtBool(c.labelCorrect),
                    fmtBool(c.appearanceOk),
                    fmtBool(c.fillWeightOk),
                  ]}
                />
              ))}
            </>
          )}

          <Text style={styles.subheading}>11.3 — Unused Packaging Return</Text>
          {batch.packagingReturn ? (
            <>
              <Field label="Returned?" value={batch.packagingReturn.returned} />
              <Field label="Quantities Returned" value={fmtVal(batch.packagingReturn.quantitiesReturned)} />
              <Field label="Returned Date" value={fmtDate(batch.packagingReturn.returnedDate)} />
            </>
          ) : (
            <Empty text="Not yet recorded." />
          )}
        </View>

        {/* Section 12 */}
        <View style={styles.section}>
          <SectionHeading number={12} title="Retained Sample Record" />
          {batch.retainedSampleRecord ? (
            <>
              <Field label="Units Collected" value={String(batch.retainedSampleRecord.unitsCollected)} />
              <Field label="Sample Label Applied" value={fmtBool(batch.retainedSampleRecord.sampleLabelApplied)} />
              <Field label="Storage Location" value={batch.retainedSampleRecord.storageLocation} />
              <Field
                label="Date Collected"
                value={`${fmtDate(batch.retainedSampleRecord.dateCollected)} (${batch.retainedSampleRecord.collectedByUser.fullName})`}
              />
              <Field label="Minimum Retention Period" value={fmtVal(batch.retainedSampleRecord.minimumRetentionPeriod)} />
              <Field
                label="Scheduled Destruction / Review"
                value={fmtDate(batch.retainedSampleRecord.scheduledDestructionReviewDate)}
              />
              <Field
                label="Destruction Authorized"
                value={
                  batch.retainedSampleRecord.destructionDate
                    ? `${fmtDate(batch.retainedSampleRecord.destructionDate)} (${batch.retainedSampleRecord.destructionAuthorizedByUser?.fullName})`
                    : 'Not yet authorized'
                }
              />
            </>
          ) : (
            <Empty text="Not yet recorded." />
          )}
        </View>

        {/* Section 13 */}
        <View style={styles.section}>
          <SectionHeading number={13} title="Equipment &amp; Cleaning Verification" />
          <TableHeader labels={['Equipment', 'Equipment ID', 'Cleaned & Verified', 'Calibration Current']} />
          {EQUIPMENT_ROW_ORDER.map((key) => {
            const row = batch.equipmentVerifications.find((r) => r.rowKey === key)
            return (
              <TableRow
                key={key}
                values={[
                  EQUIPMENT_ROW_LABELS[key],
                  fmtVal(row?.equipmentId),
                  fmtBool(row?.cleanedAndVerified),
                  fmtBool(row?.calibrationCurrent),
                ]}
              />
            )
          })}
          {batch.additionalEquipmentEntries.map((entry) => (
            <TableRow
              key={entry.id}
              values={[
                entry.equipmentName,
                fmtVal(entry.equipmentNumber),
                fmtBool(entry.cleanedAndVerified),
                fmtBool(entry.calibrationCurrent),
              ]}
            />
          ))}
        </View>

        {/* Section 14 */}
        <View style={styles.section} break>
          <SectionHeading number={14} title="Deviations &amp; Incidents" />
          {batch.noDeviationsConfirmedDate && (
            <Text style={{ marginBottom: 4 }}>
              No deviations confirmed by {batch.noDeviationsConfirmedByUser?.fullName} on{' '}
              {fmtDate(batch.noDeviationsConfirmedDate)}.
            </Text>
          )}
          {batch.deviations.length === 0 ? (
            <Empty text="No deviations logged." />
          ) : (
            <>
              <TableHeader labels={['#', 'Date/Time', 'Type', 'Description', 'Status']} />
              {batch.deviations.map((d) => (
                <TableRow
                  key={d.id}
                  values={[
                    String(d.sequenceNumber),
                    fmtDateTime(d.dateTime),
                    d.type.replaceAll('_', ' '),
                    d.description,
                    d.status === 'OPEN' ? 'OPEN' : `${d.status} by ${d.resolvedByUser?.fullName ?? '—'}`,
                  ]}
                />
              ))}
            </>
          )}
        </View>

        {/* Section 15 */}
        <View style={styles.section}>
          <SectionHeading number={15} title="Bulk Storage &amp; Post-Production Closeout" />
          {batch.postProductionCloseout ? (
            <>
              <Field label="Bulk Storage Location" value={batch.postProductionCloseout.bulkStorageLocation} />
              <Field label="Entered in Store Log" value={fmtBool(batch.postProductionCloseout.enteredInStoreLog)} />
              <Field label="Entered in ERP" value={batch.postProductionCloseout.enteredInErp} />
              <Field label="Unused RM Returned" value={batch.postProductionCloseout.unusedRmReturned} />
              <Field label="Quantities RM Returned" value={fmtVal(batch.postProductionCloseout.quantitiesRmReturned)} />
              <Field label="Steps Subcontracted" value={fmtBool(batch.postProductionCloseout.stepsSubcontracted)} />
              <Field label="Subcontractor Name / Step" value={fmtVal(batch.postProductionCloseout.subcontractorNameStep)} />
              <Field
                label="Batch Closeout Date"
                value={`${fmtDate(batch.postProductionCloseout.batchCloseoutDate)} (${batch.postProductionCloseout.closeoutByUser.fullName})`}
              />
            </>
          ) : (
            <Empty text="Not yet recorded." />
          )}
        </View>

        {/* Section 16 */}
        <View style={styles.section} break>
          <SectionHeading number={16} title="Batch Record Completeness Review" />
          <TableHeader labels={['Item', 'Status']} />
          {COMPLETENESS_ITEM_ORDER.map((key) => {
            const item = batch.completenessReviewItems.find((i) => i.itemKey === key)
            const status = item?.verified ? 'Verified' : item?.notApplicable ? 'N/A' : '—'
            return <TableRow key={key} values={[COMPLETENESS_ITEM_LABELS[key], status]} />
          })}
          {completenessSignoff ? (
            <Text style={{ marginTop: 4 }}>
              Signed off by {completenessSignoff.hopSignatureUser?.fullName} on{' '}
              {fmtDate(completenessSignoff.hopSignatureDate)}
            </Text>
          ) : (
            <Empty text="Not yet signed off." />
          )}
        </View>

        {/* Section 17 */}
        <View style={styles.section}>
          <SectionHeading number={17} title="Batch Release Decision" />
          {batch.releaseDecision?.decision ? (
            <>
              <Field label="Finished Product Spec Ref" value={fmtVal(batch.releaseDecision.finishedProductSpecRef)} />
              <Field label="In-Process Results Reviewed" value={fmtBool(batch.releaseDecision.inProcessResultsReviewed)} />
              <Field label="OOS / Pending Results" value={fmtBool(batch.releaseDecision.oosResultsPending)} />
              <Field label="Decision" value={batch.releaseDecision.decision} />
              <Field label="Rationale" value={fmtVal(batch.releaseDecision.decisionBasisRationale)} />
              <Field
                label="Reviewed By"
                value={`${batch.releaseDecision.reviewedBy?.fullName ?? '—'} on ${fmtDate(batch.releaseDecision.reviewDate)}`}
              />
            </>
          ) : (
            <Empty text="Not yet recorded." />
          )}
        </View>

        {/* Section 18 */}
        <View style={styles.section}>
          <SectionHeading number={18} title="Final Sign-Off" />
          {batch.signOffs.length === 0 ? (
            <Empty text="Not yet signed." />
          ) : (
            <>
              <TableHeader labels={['Role', 'Signed By', 'Date']} />
              {batch.signOffs.map((s) => (
                <TableRow
                  key={s.id}
                  values={[s.role.replaceAll('_', ' '), s.user.fullName, fmtDate(s.signatureDate)]}
                />
              ))}
            </>
          )}
        </View>

        {/* Section 19 */}
        <View style={styles.section} break>
          <SectionHeading number={19} title="Additional Observations &amp; Notes" />
          {batch.notes.length === 0 ? (
            <Empty text="No notes recorded." />
          ) : (
            batch.notes.map((n) => (
              <View key={n.id} style={{ marginBottom: 4 }}>
                <Text>{n.note}</Text>
                <Text style={{ color: '#999999', fontSize: 8 }}>
                  {n.authorUser.fullName} — {fmtDateTime(n.createdAt)}
                </Text>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  )
}
