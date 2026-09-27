const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR'
})

export const formatPrice = (amount) => currencyFormatter.format(Number(amount) || 0)
