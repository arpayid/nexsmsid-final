// Shared interfaces — akan bertambah seiring migrasi modul
export interface Identifiable {
  id: string;
}

export interface Timestampable {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
}
