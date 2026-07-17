const fs = require('fs');
const file = 'src/context/GameContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetFunction = `  const depositMoney = async (
    amount: number, 
    method: 'UPI' | 'Paytm' | 'PhonePe' | 'GPay' | 'Razorpay',
    refNo?: string
  ) => {
    if (!currentUser || !userProfile) return;
    
    const reference = refNo || 'TXN-' + Math.floor(Math.random() * 1000000000);
    const updated = {
      ...userProfile,
      depositBalance: userProfile.depositBalance + amount
    };

    if (!useLocalFallback) {
      // Update User balance
      await updateDoc(doc(db, 'users', currentUser.uid), {
        depositBalance: updated.depositBalance
      });

      // Post completed transaction to Firestore
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        amount,
        type: 'deposit_success',
        paymentMethod: method,
        referenceNo: reference,
        dateTime: new Date().toISOString(),
        status: 'completed',
        description: \`Deposit via \${method} Instant Add\`
      });
    } else {
      localStorage.setItem(\`profile_\${currentUser.uid}\`, JSON.stringify(updated));
      const localTrans: Transaction = {
        id: 'trans_' + Date.now(),
        userId: currentUser.uid,
        amount,
        type: 'deposit_success',
        paymentMethod: method,
        referenceNo: reference,
        dateTime: new Date().toISOString(),
        status: 'completed',
        description: \`Deposit via \${method} Local Add\`
      };
      localStorage.setItem(\`trans_\${localTrans.id}\`, JSON.stringify(localTrans));
    }
    setUserProfile(updated);
    await refreshTransactions();
  };`;

const newFunction = `  const depositMoney = async (
    amount: number, 
    method: string,
    refNo?: string
  ) => {
    if (!currentUser || !userProfile) return;
    
    const reference = refNo || 'TXN-' + Math.floor(Math.random() * 1000000000);
    
    // For manual UPI or fallback, it's pending.
    const isPending = method === 'UPI';

    if (!useLocalFallback) {
      if (!isPending) {
        // Automatically completed
        await updateDoc(doc(db, 'users', currentUser.uid), {
          depositBalance: userProfile.depositBalance + amount
        });
        setUserProfile({ ...userProfile, depositBalance: userProfile.depositBalance + amount });
      }

      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        amount,
        type: isPending ? 'deposit_pending' : 'deposit_success',
        paymentMethod: method,
        referenceNo: reference,
        dateTime: new Date().toISOString(),
        status: isPending ? 'pending' : 'completed',
        description: isPending ? \`Pending Deposit via \${method}\` : \`Deposit via \${method} Instant Add\`
      });
      if (isPending) alert("Deposit request submitted successfully! Please wait for admin approval.");
    } else {
      if (!isPending) {
        const updated = {
          ...userProfile,
          depositBalance: userProfile.depositBalance + amount
        };
        localStorage.setItem(\`profile_\${currentUser.uid}\`, JSON.stringify(updated));
        setUserProfile(updated);
      }
      const localTrans = {
        id: 'trans_' + Date.now(),
        userId: currentUser.uid,
        amount,
        type: isPending ? 'deposit_pending' : 'deposit_success',
        paymentMethod: method,
        referenceNo: reference,
        dateTime: new Date().toISOString(),
        status: isPending ? 'pending' : 'completed',
        description: isPending ? \`Pending Deposit via \${method}\` : \`Deposit via \${method} Local Add\`
      };
      localStorage.setItem(\`trans_\${localTrans.id}\`, JSON.stringify(localTrans));
      if (isPending) alert("Deposit request submitted successfully! Please wait for admin approval.");
    }
    await refreshTransactions();
  };`;

content = content.replace(targetFunction, newFunction);
fs.writeFileSync(file, content);
