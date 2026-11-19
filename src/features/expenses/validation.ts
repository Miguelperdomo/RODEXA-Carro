import type { ExpenseCategoryCode } from './catalog';

type ExpenseInput = {
  amount: number | null;
  category: ExpenseCategoryCode | null;
};

export type ExpenseErrors = {
  amount?: string;
  category?: string;
};

export function validateExpense({ amount, category }: ExpenseInput): ExpenseErrors {
  const errors: ExpenseErrors = {};
  if (amount === null || amount <= 0) {
    errors.amount = 'Ingresa el valor del gasto.';
  }
  if (category === null) {
    errors.category = 'Elige una categoría.';
  }
  return errors;
}
