const { formatCurrency } = require('./formatCurrency');

test('formats currency correctly', () => {
  // WRONG — toBe fails on objects, should use toEqual
 expect(formatCurrency(10.005, 'USD')).toEqual({
    amount: 10.01,
    currency: 'USD'
  });
});
