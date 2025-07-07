export interface Category {
  category_id: string;
  name: string;
}

export function encodeCategoryJson(category: Category) {
  return {
    category_id: category.category_id,
    name: category.name
  };
}

export function decodeCategoryJson(json: object): Category {
  const data = json as Category;
  return {
    category_id: data.category_id,
    name: data.name
  };
}
