document.getElementById('moyasarForm').innerHTML = '<div class="mysr-form"></div>';

Moyasar.init({
  element: '.mysr-form',
  amount: p.price * 100,
  currency: 'SAR',
  description: `Awaed Profits - ${p.label}`,
  publishable_api_key: 'pk_live_4A8FpY9CP5KgaWsAMwrQbysJ6swM1vUKpY5EYwam',
  callback_url: window.location.href + '?plan=' + plan,
  methods: ['creditcard', 'stcpay'],
  on_completed: async function(payment) {
    if (payment.status === 'paid') {
      await activatePlan(plan, payment.id);
      closePayment();
    }
  }
});
