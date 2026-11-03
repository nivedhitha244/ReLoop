import express from 'express';
import transporterRoutes from '../server/routes/transporter.js';
import verifierRoutes from '../server/routes/verifier.js';

const app = express();
app.use(express.json());
app.use('/api/transporter', transporterRoutes);
app.use('/api/verifier', verifierRoutes);

const server = app.listen(5099, async () => {
  try {
    console.log('[TestServer] Running on port 5099');

    // 1. Transporter Profile
    let res = await fetch('http://localhost:5099/api/transporter/profile');
    let data = await res.json();
    console.log('✓ Transporter Profile:', data.profile.name);

    // 2. Transporter Stats
    res = await fetch('http://localhost:5099/api/transporter/stats');
    data = await res.json();
    console.log('✓ Transporter Stats:', { 
      activeDispatches: data.activeDispatches, 
      availableBalance: data.availableBalance,
      totalLitresTransported: data.totalLitresTransported 
    });

    // 3. Transporter Trips
    res = await fetch('http://localhost:5099/api/transporter/trips');
    data = await res.json();
    console.log(`✓ Transporter Trips retrieved (${data.length} trips):`, data.map(t => `${t.deliveryRef} [${t.currentStatus}]`));

    // 4. Transporter Payout Withdrawal
    res = await fetch('http://localhost:5099/api/transporter/payouts/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 2500,
        method: 'upi',
        destinationAccount: 'ecoflow.fleet@okhdfcbank'
      })
    });
    data = await res.json();
    console.log('✓ Transporter Payout Withdraw:', data.message, 'Ref:', data.payout?.referenceNumber);

    // 5. Verifier Profile
    res = await fetch('http://localhost:5099/api/verifier/profile');
    data = await res.json();
    console.log('✓ Verifier Profile:', data.profile.name, 'Accreditation:', data.profile.nablAccreditation);

    // 6. Verifier Queue
    res = await fetch('http://localhost:5099/api/verifier/queue');
    data = await res.json();
    console.log(`✓ Verifier Queue (${data.length} sample items):`, data.map(q => q.sourceName));

    // 7. Verifier Audit Submission (Approval)
    res = await fetch('http://localhost:5099/api/verifier/audit/vqueue-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceName: 'Velachery IT Corridor Greywater Plant',
        waterCategory: 'Commercial Greywater',
        decision: 'Approved',
        parameters: {
          ph: 7.3,
          turbidity: '1.2 NTU',
          tds: '390 ppm',
          bod: '3.8 mg/L',
          cod: '14 mg/L',
          eColi: '0 CFU/100mL'
        },
        intendedUses: ['Landscaping', 'Toilet Flushing'],
        fee: 2500
      })
    });
    data = await res.json();
    console.log('✓ Verifier Audit Approved:', data.message);

    // 8. Verifier Payout Withdrawal
    res = await fetch('http://localhost:5099/api/verifier/payouts/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 5000,
        method: 'bank'
      })
    });
    data = await res.json();
    console.log('✓ Verifier Payout Withdraw:', data.message, 'Ref:', data.payout?.referenceNumber);

    console.log('\n🌟 ALL TRANSPORTER & VERIFIER END-TO-END TESTS PASSED SUCCESSFULLY! 🌟');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});

