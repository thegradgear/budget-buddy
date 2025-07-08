'use server';

import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { collectionGroup, getDocs, query, where, Timestamp, doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function checkBudgetAndCreateNotifications(userId: string) {
    if (!db) return;

    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.log("User doc does not exist for ID:", userId);
            return;
        };

        const userData = userDoc.data() as UserProfile;
        const { monthlyBudget = 0 } = userData;

        if (monthlyBudget <= 0) {
            return; // No budget set, do nothing.
        }

        const now = new Date();
        const currentMonthStr = format(now, 'yyyy-MM');
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const transactionsQuery = query(
            collectionGroup(db, 'transactions'),
            where('date', '>=', Timestamp.fromDate(start)),
            where('date', '<=', Timestamp.fromDate(end))
        );
        
        const snapshot = await getDocs(transactionsQuery);
        
        let totalExpenses = 0;
        snapshot.docs.forEach(doc => {
            if (doc.ref.path.startsWith(`users/${userId}/`)) {
                const data = doc.data();
                if (data.type === 'expense') {
                    totalExpenses += data.amount;
                }
            }
        });

        const spendingPercentage = (totalExpenses / monthlyBudget) * 100;
        const budgetFormatted = `₹${monthlyBudget.toLocaleString('en-IN')}`;

        // Check for 100% threshold
        if (spendingPercentage >= 100 && userData.lastNotification100Sent !== currentMonthStr) {
            await addDoc(collection(db, 'users', userId, 'notifications'), {
                message: `You have exceeded your monthly budget of ${budgetFormatted}.`,
                type: 'danger',
                read: false,
                createdAt: Timestamp.now(),
            });
            await updateDoc(userDocRef, { lastNotification100Sent: currentMonthStr });
        }
        // Check for 90% threshold (else if to prevent sending both at the same time)
        else if (spendingPercentage >= 90 && spendingPercentage < 100 && userData.lastNotification90Sent !== currentMonthStr) {
            await addDoc(collection(db, 'users', userId, 'notifications'), {
                message: `You have spent over 90% of your ${budgetFormatted} monthly budget.`,
                type: 'warning',
                read: false,
                createdAt: Timestamp.now(),
            });
            await updateDoc(userDocRef, { lastNotification90Sent: currentMonthStr });
        }

    } catch (error) {
        console.error("Error in checkBudgetAndCreateNotifications:", error);
    }
}
