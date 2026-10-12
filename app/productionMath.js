/* =========================================================
   EDIT POINT 2: AMAZON KDP BASE PRINTING PRICING RULES (US Market)
   Adjust these standard baseline costs if Amazon KDP updates its rate sheet.
   ========================================================= */
export const KDP_RATES = {
  fixedCostBW: 1.00,        // $1.00 per book (Paperback, Black & White interior)
  perPageCostBW: 0.012,     // $0.012 per page
  standardRoyaltyRate: 0.60, // 60% on Amazon store
  expandedRoyaltyRate: 0.40  // 40% for Expanded Distribution
};

/**
 * Calculates paperback printing cost, net royalty, and minimum list price.
 */
export function calculateKDPRoyalty({
  pageCount = 150,
  listPrice = 12.99,
  royaltyRate = 0.60,
}) {
  const safePages = Math.max(24, Number(pageCount) || 24);
  const safePrice = Math.max(0, Number(listPrice) || 0);

  // Printing Cost Formula = Fixed Cost + (Page Count * Per-Page Cost)
  const printingCost = KDP_RATES.fixedCostBW + (safePages * KDP_RATES.perPageCostBW);

  // Minimum List Price = Printing Cost / Selected Royalty Rate
  const minimumListPrice = royaltyRate > 0 ? (printingCost / royaltyRate) : 0;

  // Actual Author Net Profit/Royalty = (List Price * Royalty Rate) - Printing Cost
  const royaltyPerCopy = Math.max(0, (safePrice * royaltyRate) - printingCost);

  return {
    printingCost: Number(printingCost.toFixed(2)),
    minimumListPrice: Number(minimumListPrice.toFixed(2)),
    royaltyPerCopy: Number(royaltyPerCopy.toFixed(2))
  };
}

/**
 * Calculates portfolio forecast based on published/planned titles.
 */
export function calculatePortfolioRevenue({
  royaltyPerCopy = 0,
  bookCount = 1,
  estimatedSalesPerBookMonthly = 20
}) {
  const safeBooks = Math.max(1, Number(bookCount) || 1);
  const safeSales = Math.max(0, Number(estimatedSalesPerBookMonthly) || 0);

  const monthlyRevenue = safeBooks * safeSales * royaltyPerCopy;
  const annualRevenue = monthlyRevenue * 12;

  return {
    monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
    annualRevenue: Number(annualRevenue.toFixed(2))
  };
}
