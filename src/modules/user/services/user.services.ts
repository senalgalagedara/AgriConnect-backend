// services/user.service.ts
import pool from "../../../config/database";

export interface CreateUserData {
  name: string;
  email: string;
  phone: string;
  role: "farmer" | "consumer" | "driver";
  address: string;
}

export const createUser = async (data: CreateUserData) => {
  const query = `
    INSERT INTO users (name, email, phone, role, address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [data.name, data.email, data.phone, data.role, data.address];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getAllUsers = async () => {
  const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC;");
  return result.rows;
};

export const getUserById = async (id: string) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1;", [id]);
  return result.rows[0] || null; // Return null if no user found
};

export const updateUser = async (
  id: string,
  updates: Partial<CreateUserData & { status: "active" | "inactive" }>
) => {
  // Define allowed columns to prevent invalid updates
  const allowedFields = ["name", "email", "phone", "role", "address", "status"];
  const fields = Object.keys(updates).filter((field) =>
    allowedFields.includes(field)
  );

  if (fields.length === 0) return null;

  const setQuery = fields.map((field, i) => `${field} = $${i + 2}`).join(", ");
  const values = [id, ...fields.map((f) => (updates as any)[f])];

  const query = `UPDATE users SET ${setQuery} WHERE id = $1 RETURNING *;`;

  try {
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } catch (err: any) {
    console.error("❌ Update user failed:", err.message);
    throw err;
  }
};


export const deleteUser = async (id: string) => {
  const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *;", [id]);
  // Fix for rowCount null error - check if rowCount exists and is greater than 0
  return (result.rowCount !== null && result.rowCount > 0);
};

// Alternative deleteUser implementation using rows array (safer approach):
export const deleteUserAlternative = async (id: string) => {
  const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *;", [id]);
  // Since we're using RETURNING *, we can check if any rows were returned
  return result.rows.length > 0;
};