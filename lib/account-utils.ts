import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];

/**
 * Extract email domain from email address
 * @param email - Email address (e.g., "john@company.com")
 * @returns Domain (e.g., "company.com")
 */
export function extractEmailDomain(email: string): string {
  const domain = email.split('@')[1];
  if (!domain) {
    throw new Error('Invalid email format');
  }
  return domain.toLowerCase();
}

/**
 * Assign user to an existing account
 * @param userId - User ID from auth.users
 * @param accountId - Account ID to assign user to
 */
export async function assignUserToAccount(userId: string, accountId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("user_profiles")
    .update({ account_id: accountId })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to assign user to account: ${error.message}`);
  }
}

/**
 * Create a new account and assign the user to it
 * @param userId - User ID from auth.users
 * @param name - Account/company name
 * @param type - Account type (Owner, Broker, Admin, Charterer)
 * @param emaildomain - Email domain for the account
 * @param status - Account status (defaults to "Not Validated")
 */
export async function createAccountForUser(
  userId: string,
  name: string,
  type: string,
  emaildomain: string,
  status: string = "Not Validated"
): Promise<Account> {
  const supabase = createClient();

  // Create the account
  const accountData: AccountInsert = {
    name,
    type,
    status,
    emaildomain,
  };

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert(accountData)
    .select()
    .single();

  if (accountError) {
    throw new Error(`Failed to create account: ${accountError.message}`);
  }

  // Assign user to the account
  await assignUserToAccount(userId, account.id);

  return account;
}

/**
 * Find account by email domain
 * @param emaildomain - Email domain to search for
 * @returns Account if found, null otherwise
 */
export async function findAccountByEmailDomain(emaildomain: string): Promise<Account | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("emaildomain", emaildomain.toLowerCase())
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
    throw new Error(`Failed to find account: ${error.message}`);
  }

  return data || null;
}

/**
 * Get all accounts for dropdown selection
 * @returns Array of accounts
 */
export async function getAllAccounts(): Promise<Account[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all users assigned to a specific account
 * @param accountId - Account ID to get users for
 * @returns Array of user profiles with account information
 */
export async function getAccountUsers(accountId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("account_id", accountId)
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch account users: ${error.message}`);
  }

  return data || [];
}

/**
 * Update account name
 * @param accountId - Account ID to update
 * @param newName - New account name
 */
export async function updateAccountName(accountId: string, newName: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("accounts")
    .update({ name: newName })
    .eq("id", accountId);

  if (error) {
    throw new Error(`Failed to update account name: ${error.message}`);
  }
}

/**
 * Get account details by ID
 * @param accountId - Account ID
 * @returns Account details
 */
export async function getAccountById(accountId: string): Promise<Account | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
    throw new Error(`Failed to get account: ${error.message}`);
  }

  return data || null;
}

/**
 * Check if user has an account assigned
 * @param userId - User ID from auth.users
 * @returns Account ID if assigned, null otherwise
 */
export async function getUserAccountId(userId: string): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("account_id")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") { // PGRST116 = no rows returned
      console.log("No user profile found for user:", userId);
      return null;
    }
    console.error("Error getting user account:", error);
    throw new Error(`Failed to get user account: ${error.message}`);
  }

  console.log("User profile found:", data);
  return data?.account_id || null;
}
