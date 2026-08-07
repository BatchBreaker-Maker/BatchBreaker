import type { EquipmentRowKey } from '@/generated/prisma/enums'

export const EQUIPMENT_ROW_LABELS: Record<EquipmentRowKey, string> = {
  MIXING_VESSEL_POT: 'Mixing Vessel / Pot',
  STICK_BLENDER: 'Stick Blender',
  SCALES: 'Scale(s)',
  INFRARED_THERMOMETER: 'Infrared Thermometer',
  MOLDS: 'Molds',
  CUTTING_MACHINES: 'Cutting Machine(s)',
  PACKAGING_EQUIPMENT: 'Packaging Equipment',
  OTHER: 'Other',
}

export const EQUIPMENT_ROW_ORDER = Object.keys(EQUIPMENT_ROW_LABELS) as EquipmentRowKey[]
