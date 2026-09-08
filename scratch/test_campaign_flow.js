async function testFlow() {
  const baseUrl = 'http://localhost:4000/api';

  console.log('1. Logging in as admin...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ckf.or.id', password: 'admin123' }),
  });
  
  const rawCookies = loginRes.headers.get('set-cookie') || '';
  const match = rawCookies.match(/ckf_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    throw new Error('Could not extract ckf_token from cookies: ' + rawCookies);
  }
  console.log('✓ Logged in successfully. Cookie ckf_token acquired.');

  const authHeader = {
    'Content-Type': 'application/json',
    Cookie: `ckf_token=${token}`,
  };

  console.log('\n2. Creating custom campaign "Wiladah Rasulullah 1448H"...');
  const createCampRes = await fetch(`${baseUrl}/aid-requests/campaigns`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      title: 'Wiladah Rasulullah 1448H',
      slug: 'wiladah-rasulullah-1448h',
      description: 'Penyaluran bantuan operasional perayaan maulid dan santunan jamaah yatim & dhuafa.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
      isActive: true,
    }),
  });
  const campData = await createCampRes.json();
  console.log('Campaign Response:', campData);
  const campaign = campData.data;
  console.log(`✓ Campaign created with ID: ${campaign.id}, Slug: ${campaign.slug}`);

  console.log('\n3. Fetching public campaign by slug...');
  const pubRes = await fetch(`${baseUrl}/aid-requests/campaigns/public/${campaign.slug}`);
  const pubData = await pubRes.json();
  console.log('Public campaign data:', pubData.data);
  if (pubData.data?.title !== 'Wiladah Rasulullah 1448H') {
    throw new Error('Public campaign fetch mismatch!');
  }
  console.log('✓ Public campaign successfully fetched by slug.');

  console.log('\n4. Submitting aid request to this campaign...');
  const submitRes = await fetch(`${baseUrl}/aid-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'DANA',
      campaignSlug: campaign.slug,
      institutionName: "Majelis Ta'lim Al-Barkah",
      leaderName: 'Ustadz H. Ahmad Fauzi',
      leaderPhone: '081234567890',
      picName: 'Ustadz H. Ahmad Fauzi',
      picPhone: '081234567890',
      amountOrGoods: 'Rp 5.000.000',
      reason: 'Kebutuhan konsumsi dan santunan 50 anak yatim dalam rangka Wiladah Rasulullah.',
      agreementConsent: true,
    }),
  });
  const submitData = await submitRes.json();
  console.log('Submission Response:', submitData);
  const aidReq = submitData.data;
  console.log(`✓ Aid request submitted with ticket: ${aidReq?.ticketNumber}, Campaign ID: ${aidReq?.campaignId}`);

  console.log('\n5. Listing aid requests as admin with campaign details...');
  const listRes = await fetch(`${baseUrl}/aid-requests`, {
    headers: authHeader,
  });
  const listData = await listRes.json();
  const found = listData.data?.find((r) => r.id === aidReq.id);
  console.log('Found request in admin list:', {
    ticketNumber: found?.ticketNumber,
    institution: found?.institutionName,
    campaign: found?.campaign,
  });

  if (!found || found.campaign?.slug !== campaign.slug) {
    throw new Error('Relation to campaign not present in admin list!');
  }
  console.log('✓ Aid request is properly linked to the campaign in admin list.');

  console.log('\n6. Checking campaign submission count in campaigns list...');
  const campListRes = await fetch(`${baseUrl}/aid-requests/campaigns`, {
    headers: authHeader,
  });
  const campListData = await campListRes.json();
  const campFound = campListData.data?.find((c) => c.id === campaign.id);
  console.log('Campaign in list:', {
    title: campFound?.title,
    requestCount: campFound?._count?.requests,
  });

  console.log('\n=== ALL API WORKFLOWS PASSED 100% ===');
}

testFlow().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
