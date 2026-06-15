export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export class PaginationHelper {
  static createMeta(total: number, page: number, limit: number): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
