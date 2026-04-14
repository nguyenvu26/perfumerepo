export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  skip: number;
  take: number;
  pages: number;
};

export type LegacyPaginatedDataResponse<T> = {
  data: T[];
  total: number;
  skip: number;
  take: number;
  pages?: number;
};

export type LegacyPaginatedItemsResponse<T> = {
  items: T[];
  total: number;
  skip: number;
  take: number;
  pages?: number;
};

export function normalizePaginatedResponse<T>(
  res: LegacyPaginatedDataResponse<T> | LegacyPaginatedItemsResponse<T>,
): PaginatedResponse<T> {
  const items = 'items' in res ? res.items : res.data;
  const take = res.take || 10;
  return {
    items,
    total: res.total,
    skip: res.skip,
    take,
    pages: res.pages ?? Math.ceil(res.total / take),
  };
}

