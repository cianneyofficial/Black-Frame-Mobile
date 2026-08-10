import { z } from "zod";
import type { MediaItem, Phone, PhoneStatus } from "@/hooks/types";

export const PHASE_A_FORMAT_VERSION = 1;
export const PHONES_STORAGE_KEY = "blackframe_phones";
export const RATE_STORAGE_KEY = "blackframe_rate";
export const DEFAULT_EXCHANGE_RATE = 2500;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isSupportedMediaSource(value: string): boolean {
  if (value.startsWith("data:")) return /^data:[^;,]+(?:;[^,]*)?,/.test(value);
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const dateOnlySchema = z.string().refine(isValidDateOnly, "Date invalide (format attendu : AAAA-MM-JJ)");

export const legacyMediaSchema = z.object({
  id: z.string().trim().min(1, "Identifiant média manquant"),
  type: z.enum(["image", "video"]),
  src: z.string().trim().min(1, "Source média manquante").refine(
    isSupportedMediaSource,
    "Source média invalide : URL HTTP(S) ou Data URL attendue",
  ),
  name: z.string().optional(),
}).passthrough();

export const legacyPhoneSchema = z.object({
  id: z.string().trim().min(1, "Identifiant téléphone manquant"),
  model: z.string().trim().min(1, "Modèle manquant"),
  purchasePrice: z.number().finite().nonnegative("Prix d'achat invalide"),
  repairCost: z.number().finite().nonnegative("Coût de réparation invalide"),
  salePrice: z.number().finite().nonnegative("Prix de vente invalide"),
  minPrice: z.number().finite().nonnegative("Prix minimum invalide"),
  status: z.enum(["Disponible", "Réservé", "Vendu"]),
  purchaseDate: dateOnlySchema,
  saleDate: dateOnlySchema.optional(),
  notes: z.string(),
  media: z.array(legacyMediaSchema),
}).passthrough();

export const legacyPhonesArraySchema = z.array(legacyPhoneSchema);

export type LegacyPhone = z.infer<typeof legacyPhoneSchema>;
export type LegacyMedia = z.infer<typeof legacyMediaSchema>;

export interface MigrationValidationError {
  index: number;
  path: string;
  message: string;
  code: string;
}

export interface DuplicateIdentifier {
  id: string;
  indexes: number[];
}

export interface MigrationValidationReport {
  total: number;
  valid: number;
  invalid: number;
  duplicateCount: number;
  duplicates: DuplicateIdentifier[];
  errors: MigrationValidationError[];
  rootErrors: string[];
}

function formatIssuePath(path: PropertyKey[]): string {
  return path.length ? path.map(String).join(".") : "$";
}

export function validateLegacyPhones(input: unknown): MigrationValidationReport {
  const rootErrors: string[] = [];
  if (!Array.isArray(input)) {
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      duplicateCount: 0,
      duplicates: [],
      errors: [],
      rootErrors: ["Le stock doit être un tableau JSON de téléphones"],
    };
  }

  const idIndexes = new Map<string, number[]>();
  const errors: MigrationValidationError[] = [];
  const schemaValidIndexes = new Set<number>();

  input.forEach((phone, index) => {
    if (typeof phone === "object" && phone !== null && "id" in phone && typeof phone.id === "string") {
      const indexes = idIndexes.get(phone.id) ?? [];
      indexes.push(index);
      idIndexes.set(phone.id, indexes);
    }

    const result = legacyPhoneSchema.safeParse(phone);
    if (result.success) {
      schemaValidIndexes.add(index);
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          index,
          path: formatIssuePath(issue.path),
          message: issue.message,
          code: issue.code,
        });
      }
    }
  });

  const duplicates = [...idIndexes.entries()]
    .filter(([, indexes]) => indexes.length > 1)
    .map(([id, indexes]) => ({ id, indexes }));
  const duplicateCount = duplicates.reduce((count, duplicate) => count + duplicate.indexes.length - 1, 0);

  for (const duplicate of duplicates) {
    duplicate.indexes.slice(1).forEach(index => {
      errors.push({
        index,
        path: "id",
        message: `Identifiant dupliqué : ${duplicate.id}`,
        code: "duplicate_id",
      });
    });
  }

  const total = input.length;
  const duplicateIndexes = new Set(
    duplicates.flatMap(duplicate => duplicate.indexes.slice(1)),
  );
  const valid = [...schemaValidIndexes].filter(index => !duplicateIndexes.has(index)).length;
  const invalid = total - valid;
  return {
    total,
    valid,
    invalid,
    duplicateCount,
    duplicates,
    errors,
    rootErrors,
  };
}

const backupEnvelopeSchema = z.object({
  version: z.literal(PHASE_A_FORMAT_VERSION),
  exportedAt: z.string().datetime({ offset: true }),
  exchangeRate: z.number().finite().positive("Taux de change invalide"),
  phones: z.array(z.unknown()),
}).passthrough();

export type BackupPayload = z.infer<typeof backupEnvelopeSchema>;

export interface BackupValidationResult {
  success: boolean;
  payload?: BackupPayload;
  report: MigrationValidationReport;
  errors: string[];
}

export function validateBackupPayload(input: unknown): BackupValidationResult {
  const envelope = backupEnvelopeSchema.safeParse(input);
  if (!envelope.success) {
    return {
      success: false,
      report: emptyValidationReport(),
      errors: envelope.error.issues.map(issue => `${formatIssuePath(issue.path)} : ${issue.message}`),
    };
  }

  const report = validateLegacyPhones(envelope.data.phones);
  return {
    success: report.errors.length === 0 && report.rootErrors.length === 0,
    payload: envelope.data,
    report,
    errors: report.rootErrors,
  };
}

function emptyValidationReport(): MigrationValidationReport {
  return {
    total: 0,
    valid: 0,
    invalid: 0,
    duplicateCount: 0,
    duplicates: [],
    errors: [],
    rootErrors: [],
  };
}

export function parseBackupText(text: string): BackupValidationResult {
  try {
    return validateBackupPayload(JSON.parse(text) as unknown);
  } catch {
    return {
      success: false,
      report: emptyValidationReport(),
      errors: ["Le fichier n'est pas un JSON valide"],
    };
  }
}

function readStoredPhones(storage: Storage): unknown[] {
  const raw = storage.getItem(PHONES_STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [{ __rawStorageValue: raw }];
  }
}

function readStoredRate(storage: Storage): number {
  const raw = storage.getItem(RATE_STORAGE_KEY);
  const rate = raw === null ? DEFAULT_EXCHANGE_RATE : Number(raw);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_EXCHANGE_RATE;
}

export function createBackupPayload(
  storage: Storage = window.localStorage,
  now: Date = new Date(),
): BackupPayload {
  return {
    version: PHASE_A_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    exchangeRate: readStoredRate(storage),
    phones: readStoredPhones(storage),
  };
}

export function serializeBackupPayload(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function restoreBackupPayload(
  payload: BackupPayload,
  storage: Storage = window.localStorage,
): void {
  storage.setItem(PHONES_STORAGE_KEY, JSON.stringify(payload.phones));
  storage.setItem(RATE_STORAGE_KEY, String(payload.exchangeRate));
}

export interface DatabasePhone {
  id: string;
  legacyId?: string;
  model: string;
  purchasePrice: number;
  repairCost: number;
  salePrice: number;
  minimumPrice: number;
  status: PhoneStatus;
  purchaseDate: string;
  soldDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseMedia {
  id: string;
  legacyId?: string;
  phoneId: string;
  type: "image" | "video";
  url: string;
  filename: string;
  createdAt: string;
}

export interface DatabaseExchangeRate {
  id: string;
  currencyFrom: string;
  currencyTo: string;
  rate: number;
  updatedAt: string;
}

export interface DatabaseSetting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface LegacyIdMapping {
  entity: "phone" | "media";
  legacyId: string;
  databaseId: string;
}

export interface LegacyPhoneMigration {
  phone: DatabasePhone;
  media: DatabaseMedia[];
  idMappings: LegacyIdMapping[];
}

export interface LegacyPhoneTransformOptions {
  now?: Date;
  createId?: () => string;
}

function createMigrationId(legacyId: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `legacy-${legacyId}`;
}

export function transformLegacyPhone(
  legacyPhone: LegacyPhone,
  options: LegacyPhoneTransformOptions = {},
): LegacyPhoneMigration {
  const now = (options.now ?? new Date()).toISOString();
  const createId = options.createId ?? (() => createMigrationId(legacyPhone.id));
  const databasePhoneId = createId();
  const phone: DatabasePhone = {
    id: databasePhoneId,
    legacyId: legacyPhone.id,
    model: legacyPhone.model,
    purchasePrice: legacyPhone.purchasePrice,
    repairCost: legacyPhone.repairCost,
    salePrice: legacyPhone.salePrice,
    minimumPrice: legacyPhone.minPrice,
    status: legacyPhone.status,
    purchaseDate: legacyPhone.purchaseDate,
    soldDate: legacyPhone.saleDate,
    notes: legacyPhone.notes,
    createdAt: now,
    updatedAt: now,
  };

  const media = legacyPhone.media.map(item => {
    const databaseMediaId = createId();
    const databaseMedia: DatabaseMedia = {
      id: databaseMediaId,
      legacyId: item.id,
      phoneId: databasePhoneId,
      type: item.type,
      url: item.src,
      filename: item.name ?? item.id,
      createdAt: now,
    };
    return databaseMedia;
  });

  return {
    phone,
    media,
    idMappings: [
      { entity: "phone", legacyId: legacyPhone.id, databaseId: databasePhoneId },
      ...media.map(item => ({
        entity: "media" as const,
        legacyId: item.legacyId!,
        databaseId: item.id,
      })),
    ],
  };
}

export function transformLegacyPhoneToDatabasePhone(
  legacyPhone: LegacyPhone,
  options: LegacyPhoneTransformOptions = {},
): DatabasePhone {
  return transformLegacyPhone(legacyPhone, options).phone;
}

export function legacyPhoneFromCurrentPhone(phone: Phone): LegacyPhone {
  return {
    id: phone.id,
    model: phone.model,
    purchasePrice: phone.purchasePrice,
    repairCost: phone.repairCost,
    salePrice: phone.salePrice,
    minPrice: phone.minPrice,
    status: phone.status,
    purchaseDate: phone.purchaseDate,
    saleDate: phone.saleDate,
    notes: phone.notes,
    media: phone.media.map(item => ({
      id: item.id,
      type: item.type,
      src: item.src,
      ...(item.name ? { name: item.name } : {}),
    })),
  };
}