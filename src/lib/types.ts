export type Role = "user" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  nim: string | null;
  role: Role;
  created_at: string;
};

export type Lab = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  created_at: string;
};

export type Item = {
  id: string;
  lab_id: string;
  name: string;
  code: string | null;
  description: string | null;
  quantity_total: number;
  quantity_available: number;
  condition: "baik" | "rusak_ringan" | "rusak_berat";
  created_at: string;
};

export type LoanStatus = "pending" | "approved" | "rejected" | "returned";

export type Loan = {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  purpose: string | null;
  borrow_date: string;
  due_date: string;
  returned_at: string | null;
  status: LoanStatus;
  admin_note: string | null;
  created_at: string;
};
