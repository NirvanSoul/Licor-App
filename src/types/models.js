/**
 * @typedef {Object} Product
 * @property {string} id - UUID
 * @property {string} organization_id - UUID
 * @property {string} name
 * @property {string|null} color
 * @property {boolean} is_active
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object} AppSetting
 * @property {number} id - BigInt (handled as number/string)
 * @property {string} organization_id - UUID
 * @property {string} key
 * @property {Object} value - JSONb
 * @property {string} updated_at - ISO timestamp
 */

/**
 * @typedef {Object} InventoryItem
 * @property {number} id - BigInt
 * @property {string} organization_id - UUID
 * @property {string} product_id - UUID
 * @property {string} subtype
 * @property {number} quantity
 * @property {string} updated_at
 * @property {Product} [products] - Joined product data
 */

/**
 * @typedef {Object} Price
 * @property {number} id - BigInt
 * @property {string} organization_id - UUID
 * @property {string} product_id - UUID
 * @property {string} emission
 * @property {string} subtype
 * @property {number} price
 * @property {boolean} is_local
 * @property {string} updated_at
 * @property {Product} [products] - Joined product data
 */

/**
 * @typedef {Object} Conversion
 * @property {number} id - BigInt
 * @property {string} organization_id - UUID
 * @property {string} emission
 * @property {string} subtype
 * @property {number} units
 */

/**
 * @typedef {Object} Sale
 * @property {string} id - UUID
 * @property {string} organization_id - UUID
 * @property {string} product_name_snapshot
 * @property {string} product_id - UUID
 * @property {string} subtype
 * @property {string} emission
 * @property {number} quantity
 * @property {number} total_price
 * @property {string|null} payment_method
 * @property {string|null} sold_by - UUID (Profile ID)
 * @property {string} created_at
 * @property {Product} [products] - Joined product data
 * @property {Object} [profiles] - Joined profile data
 */

export const Models = {}; // Export empty object to allow import
