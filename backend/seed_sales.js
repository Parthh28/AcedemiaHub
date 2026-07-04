require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function seedSales() {
  try {
    // 1. Find Sneha's user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, first_name')
      .ilike('first_name', '%Sneha%')
      .limit(1);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      console.log('User Sneha not found in database.');
      return;
    }
    const snehaId = users[0].id;
    console.log(`Found Sneha with ID: ${snehaId}`);

    // 2. Ensure Sneha has multiple notes
    let { data: existingNotes, error: notesError } = await supabase
      .from('notes')
      .select('id, title, price, download_count')
      .eq('seller_id', snehaId);

    if (notesError) throw notesError;

    const notesToCreate = [
      { title: 'Complete System Design Guide', subject: 'Computer Science', price: 299 },
      { title: 'Thermodynamics Advanced Notes', subject: 'Engineering', price: 450 },
      { title: 'Linear Algebra Cheat Sheet', subject: 'Mathematics', price: 150 },
      { title: 'Operating Systems – Exam Ready', subject: 'Computer Science', price: 300 }
    ];

    const activeNotes = [];

    for (const n of notesToCreate) {
      const existing = (existingNotes || []).find(e => e.title.includes(n.title.split(' ')[0]));
      if (existing) {
        activeNotes.push(existing);
      } else {
        const newNote = {
          id: uuidv4(),
          seller_id: snehaId,
          title: n.title,
          subject: n.subject,
          price: n.price,
          status: 'live',
          is_free: false,
          download_count: 0,
          file_url: 'dummy.pdf'
        };
        const { error: insertNoteError } = await supabase.from('notes').insert(newNote);
        if (insertNoteError) throw insertNoteError;
        activeNotes.push(newNote);
      }
    }

    // 3. Create dummy purchases & seller_earnings over the last 7 days
    console.log('Generating dummy sales...');
    const salesData = [];
    const earningsData = [];
    const newUsers = [];
    
    // We'll generate a random number of sales per day for the last 30 days
    let totalSales = 0;
    
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        // Random sales between 1 and 5 per day
        const salesCount = Math.floor(Math.random() * 5) + 1;
        totalSales += salesCount;
        
        for (let j = 0; j < salesCount; j++) {
            const purchaseId = uuidv4();
            const dummyBuyerId = uuidv4();
            const dateStr = d.toISOString();

            // Randomly select one of Sneha's notes
            const randomNote = activeNotes[Math.floor(Math.random() * activeNotes.length)];
            randomNote.download_count = (randomNote.download_count || 0) + 1;
            
            newUsers.push({
                id: dummyBuyerId,
                email: `dummy_${dummyBuyerId.substring(0,8)}@example.com`,
                password_hash: 'hash',
                first_name: 'Dummy',
                last_name: 'Buyer',
                role: 'buyer'
            });

            salesData.push({
                id: purchaseId,
                notes_id: randomNote.id,
                buyer_id: dummyBuyerId, 
                amount_paid: randomNote.price,
                payment_method: 'wallet',
                status: 'completed',
                purchased_at: dateStr
            });
            
            earningsData.push({
                id: uuidv4(),
                seller_id: snehaId,
                purchase_id: purchaseId,
                notes_id: randomNote.id,
                gross_amount: randomNote.price,
                platform_commission: randomNote.price * 0.2, // 20%
                net_amount: randomNote.price * 0.8,
                status: 'available',
                created_at: dateStr
            });
        }
    }
    
    // Insert Users
    const { error: usersError } = await supabase.from('users').insert(newUsers);
    if (usersError) throw usersError;

    // Insert Purchases
    const { error: purchaseError } = await supabase.from('purchases').insert(salesData);
    if (purchaseError) throw purchaseError;
    
    // Insert Earnings
    const { error: earningsError } = await supabase.from('seller_earnings').insert(earningsData);
    if (earningsError) throw earningsError;
    
    // Update Note Download counts
    for (const n of activeNotes) {
        await supabase.from('notes').update({ download_count: n.download_count }).eq('id', n.id);
    }

    console.log(`Successfully generated ${totalSales} dummy sales for Sneha!`);
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

seedSales();
